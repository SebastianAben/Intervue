import type { NonverbalFeatures } from '@intervue/shared';
import {
  FaceLandmarker,
  FilesetResolver,
  PoseLandmarker,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

const visionWasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const faceModelUrl =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';
const poseModelUrl =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

type Point = {
  x: number;
  y: number;
};

type FrameMeasurement = {
  faceDetected: boolean;
  yaw?: number;
  pitch?: number;
  roll?: number;
  mouth?: number;
  shoulder?: number;
  hand?: number;
};

export type NonverbalReadinessSnapshot = {
  faceDetectedRatio: number;
  handMovementMean: number;
  headPitchMean: number;
  headYawMean: number;
  mouthMovementMean: number;
  sampleCount: number;
  shoulderMovementMean: number;
};

type NonverbalLandmarkers = {
  face: FaceLandmarker;
  pose: PoseLandmarker;
};

let landmarkersPromise: Promise<NonverbalLandmarkers> | null = null;

function distance2d(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function safeMean(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function safeStd(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = safeMean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length;
  return Math.sqrt(variance);
}

function landmarkAt(landmarks: NormalizedLandmark[], index: number): Point | null {
  const landmark = landmarks[index];
  return landmark ? { x: landmark.x, y: landmark.y } : null;
}

async function createLandmarkers() {
  const vision = await FilesetResolver.forVisionTasks(visionWasmUrl);
  const [face, pose] = await Promise.all([
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: faceModelUrl,
      },
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
      runningMode: 'VIDEO',
    }),
    PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: poseModelUrl,
      },
      numPoses: 1,
      runningMode: 'VIDEO',
    }),
  ]);

  return { face, pose };
}

export function loadNonverbalLandmarkers() {
  landmarkersPromise ??= createLandmarkers();
  return landmarkersPromise;
}

function measureFace(result: FaceLandmarkerResult) {
  const landmarks = result.faceLandmarks[0];
  if (!landmarks) {
    return {
      faceDetected: false,
    };
  }

  const nose = landmarkAt(landmarks, 1);
  const leftEye = landmarkAt(landmarks, 33);
  const rightEye = landmarkAt(landmarks, 263);
  const topFace = landmarkAt(landmarks, 10);
  const bottomFace = landmarkAt(landmarks, 152);
  const upperLip = landmarkAt(landmarks, 13);
  const lowerLip = landmarkAt(landmarks, 14);

  if (!nose || !leftEye || !rightEye || !topFace || !bottomFace || !upperLip || !lowerLip) {
    return {
      faceDetected: false,
    };
  }

  const faceCenterX = (leftEye.x + rightEye.x) / 2;
  const faceCenterY = (topFace.y + bottomFace.y) / 2;
  const eyeDistance = Math.max(distance2d(leftEye, rightEye), 1e-6);
  const faceHeight = Math.max(distance2d(topFace, bottomFace), 1e-6);

  return {
    faceDetected: true,
    mouth: distance2d(upperLip, lowerLip) / faceHeight,
    pitch: (nose.y - faceCenterY) / faceHeight,
    roll: Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x),
    yaw: (nose.x - faceCenterX) / eyeDistance,
  };
}

function measurePose(
  result: PoseLandmarkerResult,
  previousShoulderCenter: Point | null,
  previousHandCenter: Point | null,
) {
  const landmarks = result.landmarks[0];
  if (!landmarks) {
    return {
      handCenter: previousHandCenter,
      shoulderCenter: previousShoulderCenter,
    };
  }

  const leftShoulder = landmarkAt(landmarks, 11);
  const rightShoulder = landmarkAt(landmarks, 12);
  const leftWrist = landmarkAt(landmarks, 15);
  const rightWrist = landmarkAt(landmarks, 16);

  if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) {
    return {
      handCenter: previousHandCenter,
      shoulderCenter: previousShoulderCenter,
    };
  }

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const handCenter = {
    x: (leftWrist.x + rightWrist.x) / 2,
    y: (leftWrist.y + rightWrist.y) / 2,
  };

  return {
    hand: previousHandCenter ? distance2d(handCenter, previousHandCenter) : undefined,
    handCenter,
    shoulder: previousShoulderCenter
      ? distance2d(shoulderCenter, previousShoulderCenter)
      : undefined,
    shoulderCenter,
  };
}

export class NonverbalFeatureCapture {
  private frames: FrameMeasurement[] = [];
  private previousHandCenter: Point | null = null;
  private previousShoulderCenter: Point | null = null;
  private startedAt = 0;
  private lastSampleAt = 0;

  constructor(
    private video: HTMLVideoElement,
    private readonly landmarkers: NonverbalLandmarkers,
    private readonly sampleIntervalMs = 180,
  ) {}

  setVideo(video: HTMLVideoElement) {
    this.video = video;
  }

  start() {
    this.frames = [];
    this.previousHandCenter = null;
    this.previousShoulderCenter = null;
    this.startedAt = performance.now();
    this.lastSampleAt = 0;
  }

  sample() {
    if (!this.startedAt || this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return false;
    }

    const now = performance.now();
    if (now - this.lastSampleAt < this.sampleIntervalMs) {
      return false;
    }

    this.lastSampleAt = now;

    try {
      const face = measureFace(this.landmarkers.face.detectForVideo(this.video, now));
      const pose = measurePose(
        this.landmarkers.pose.detectForVideo(this.video, now),
        this.previousShoulderCenter,
        this.previousHandCenter,
      );

      this.previousShoulderCenter = pose.shoulderCenter;
      this.previousHandCenter = pose.handCenter;

      this.frames.push({
        ...face,
        hand: pose.hand,
        shoulder: pose.shoulder,
      });
      return true;
    } catch {
      return false;
    }
  }

  snapshot(): NonverbalFeatures | null {
    if (!this.startedAt || this.frames.length === 0) {
      return null;
    }

    const analyzedDurationSeconds = Math.max((performance.now() - this.startedAt) / 1000, 0);
    const yawValues = this.frames.flatMap((frame) => (frame.yaw === undefined ? [] : [frame.yaw]));
    const pitchValues = this.frames.flatMap((frame) =>
      frame.pitch === undefined ? [] : [frame.pitch],
    );
    const rollValues = this.frames.flatMap((frame) =>
      frame.roll === undefined ? [] : [frame.roll],
    );
    const mouthValues = this.frames.flatMap((frame) =>
      frame.mouth === undefined ? [] : [frame.mouth],
    );
    const shoulderValues = this.frames.flatMap((frame) =>
      frame.shoulder === undefined ? [] : [frame.shoulder],
    );
    const handValues = this.frames.flatMap((frame) =>
      frame.hand === undefined ? [] : [frame.hand],
    );

    return {
      analyzed_duration_seconds: analyzedDurationSeconds,
      face_detected_ratio:
        this.frames.filter((frame) => frame.faceDetected).length / Math.max(this.frames.length, 1),
      frame_count: this.frames.length,
      hand_movement_mean: safeMean(handValues),
      hand_movement_std: safeStd(handValues),
      head_pitch_mean: safeMean(pitchValues),
      head_pitch_std: safeStd(pitchValues),
      head_roll_mean: safeMean(rollValues),
      head_roll_std: safeStd(rollValues),
      head_yaw_mean: safeMean(yawValues),
      head_yaw_std: safeStd(yawValues),
      mouth_movement_mean: safeMean(mouthValues),
      mouth_movement_std: safeStd(mouthValues),
      shoulder_movement_mean: safeMean(shoulderValues),
      shoulder_movement_std: safeStd(shoulderValues),
    };
  }

  stop(): NonverbalFeatures | null {
    return this.snapshot();
  }

  readiness(windowSize = 14): NonverbalReadinessSnapshot | null {
    const frames = this.frames.slice(-windowSize);
    if (frames.length === 0) {
      return null;
    }

    const yawValues = frames.flatMap((frame) => (frame.yaw === undefined ? [] : [frame.yaw]));
    const pitchValues = frames.flatMap((frame) => (frame.pitch === undefined ? [] : [frame.pitch]));
    const mouthValues = frames.flatMap((frame) => (frame.mouth === undefined ? [] : [frame.mouth]));
    const shoulderValues = frames.flatMap((frame) =>
      frame.shoulder === undefined ? [] : [frame.shoulder],
    );
    const handValues = frames.flatMap((frame) => (frame.hand === undefined ? [] : [frame.hand]));

    return {
      faceDetectedRatio:
        frames.filter((frame) => frame.faceDetected).length / Math.max(frames.length, 1),
      handMovementMean: safeMean(handValues),
      headPitchMean: safeMean(pitchValues),
      headYawMean: safeMean(yawValues),
      mouthMovementMean: safeMean(mouthValues),
      sampleCount: frames.length,
      shoulderMovementMean: safeMean(shoulderValues),
    };
  }
}
