import type { NonverbalFeatures } from '@intervue/shared';
import { env } from '../config/env.js';

export const nonverbalFeatureOrder = [
  'face_detected_ratio',
  'head_yaw_mean',
  'head_yaw_std',
  'head_pitch_mean',
  'head_pitch_std',
  'head_roll_mean',
  'head_roll_std',
  'mouth_movement_mean',
  'mouth_movement_std',
  'shoulder_movement_mean',
  'shoulder_movement_std',
  'hand_movement_mean',
  'hand_movement_std',
  'frame_count',
  'analyzed_duration_seconds',
] as const satisfies readonly (keyof NonverbalFeatures)[];

export type NonverbalPredictionResult =
  | {
      nonverbalScore: number;
      nonverbalModelName: string;
      nonverbalModelVersion: string;
      nonverbalSource: 'client_mediapipe';
      nonverbalError: null;
    }
  | {
      nonverbalScore: null;
      nonverbalModelName: null;
      nonverbalModelVersion: null;
      nonverbalSource: 'client_mediapipe';
      nonverbalError: string;
    };

type InferenceResponse = {
  nonverbalScore?: unknown;
  nonverbalModelName?: unknown;
  nonverbalModelVersion?: unknown;
};

function normalizeInferenceError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Non-verbal inference failed.';
}

function validateScore(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Inference response did not include a numeric nonverbalScore.');
  }

  return Math.round(Math.min(100, Math.max(0, value)));
}

export async function predictNonverbalSignals(
  features: NonverbalFeatures,
): Promise<NonverbalPredictionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(env.NONVERBAL_INFERENCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Non-verbal inference returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as InferenceResponse;
    const nonverbalScore = validateScore(payload.nonverbalScore);

    if (
      typeof payload.nonverbalModelName !== 'string' ||
      typeof payload.nonverbalModelVersion !== 'string'
    ) {
      throw new Error('Inference response did not include model metadata.');
    }

    return {
      nonverbalScore,
      nonverbalModelName: payload.nonverbalModelName,
      nonverbalModelVersion: payload.nonverbalModelVersion,
      nonverbalSource: 'client_mediapipe',
      nonverbalError: null,
    };
  } catch (error) {
    return {
      nonverbalScore: null,
      nonverbalModelName: null,
      nonverbalModelVersion: null,
      nonverbalSource: 'client_mediapipe',
      nonverbalError: normalizeInferenceError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
