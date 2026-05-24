'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  InterviewSessionDetail,
  NonverbalFeatures,
  TranscriptCorrection,
} from '@intervue/shared';
import { applyTranscriptCorrections, shouldReviewTranscriptCorrection } from '@intervue/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScoreMeter } from '@/components/voice/score-meter';
import { humanizeApiError, submitTurnAnswer } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import {
  loadNonverbalLandmarkers,
  NonverbalFeatureCapture,
  type NonverbalReadinessSnapshot,
} from './nonverbal-feature-capture';
import { useLiveSpeechRecognition } from './use-live-speech-recognition';
import { useQuestionSpeech } from './use-question-speech';

type FullSimulationStage =
  | 'preparing'
  | 'ready_to_start'
  | 'ai_speaking'
  | 'listening'
  | 'review_transcript'
  | 'auto_submitting'
  | 'next_question'
  | 'completed'
  | 'error';

type CameraState = 'idle' | 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';
type MicrophoneState = 'idle' | 'checking' | 'ready' | 'denied' | 'unsupported' | 'error';

type SpeechRecognitionConstructor = new () => unknown;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type PendingTranscriptReview = {
  corrections: TranscriptCorrection[];
  durationSeconds: number;
  featuresForSubmit: NonverbalFeatures | null;
  rawTranscript: string;
};

const silenceThresholdMs = 2500;
const minimumAnswerSeconds = 8;
const minimumAnswerWords = 12;

function findCurrentTurn(session: InterviewSessionDetail) {
  return session.turns.find((turn) => !turn.answerTranscript) ?? session.turns[0] ?? null;
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasSpeechRecognitionSupport() {
  if (typeof window === 'undefined') {
    return false;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition);
}

function getReadiness(readiness: NonverbalReadinessSnapshot | null, cameraState: CameraState) {
  if (cameraState !== 'ready') {
    return {
      isReady: true,
      label: 'Kamera tidak menjadi syarat. Sistem memakai hening dan panjang jawaban.',
    };
  }

  if (!readiness || readiness.sampleCount < 8) {
    return {
      isReady: false,
      label: 'Mengumpulkan sinyal kamera.',
    };
  }

  const isReady =
    readiness.faceDetectedRatio >= 0.8 &&
    Math.abs(readiness.headYawMean) <= 0.18 &&
    Math.abs(readiness.headPitchMean) <= 0.18 &&
    readiness.mouthMovementMean <= 0.015 &&
    readiness.handMovementMean <= 0.025 &&
    readiness.shoulderMovementMean <= 0.02;

  return {
    isReady,
    label: isReady
      ? 'User terlihat siap lanjut.'
      : 'Menunggu sinyal wajah dan gerakan lebih stabil.',
  };
}

function stageLabel(stage: FullSimulationStage) {
  const labels: Record<FullSimulationStage, string> = {
    ai_speaking: 'AI membacakan pertanyaan',
    auto_submitting: 'Memproses jawaban',
    completed: 'Sesi selesai',
    error: 'Butuh tindakan',
    listening: 'Mendengarkan jawaban',
    next_question: 'Menyiapkan pertanyaan berikutnya',
    preparing: 'Persiapan perangkat',
    ready_to_start: 'Siap mulai',
    review_transcript: 'Review transcript',
  };

  return labels[stage];
}

function liveHeadline(stage: FullSimulationStage) {
  const labels: Record<FullSimulationStage, string> = {
    ai_speaking: 'Interviewer sedang berbicara.',
    auto_submitting: 'Jawaban sedang diproses.',
    completed: 'Interview selesai. Report sedang dibuka.',
    error: 'Sesi membutuhkan tindakan.',
    listening: 'Silakan jawab seperti interview langsung.',
    next_question: 'Interviewer menyiapkan giliran berikutnya.',
    preparing: 'Siapkan perangkat sebelum interview.',
    ready_to_start: 'Ruang interview siap.',
    review_transcript: 'Periksa transcript sebelum dikirim.',
  };

  return labels[stage];
}

function microphoneStatusLabel(state: MicrophoneState) {
  const labels: Record<MicrophoneState, string> = {
    checking: 'Meminta akses microphone.',
    denied: 'Akses microphone ditolak.',
    error: 'Microphone belum bisa digunakan.',
    idle: 'Belum dicek.',
    ready: 'Microphone siap.',
    unsupported: 'Browser tidak mendukung akses microphone.',
  };

  return labels[state];
}

function cameraStatusLabel(state: CameraState) {
  const labels: Record<CameraState, string> = {
    denied: 'Akses kamera ditolak. Interview tetap bisa dimulai.',
    error: 'Kamera belum bisa digunakan. Readiness visual dinonaktifkan.',
    idle: 'Opsional, belum dicek.',
    loading: 'Menyiapkan kamera dan MediaPipe.',
    ready: 'Kamera siap untuk readiness signal.',
    unsupported: 'Browser tidak mendukung kamera.',
  };

  return labels[state];
}

export function FullSimulationRoom({ initialSession }: { initialSession: InterviewSessionDetail }) {
  const [session, setSession] = useState(initialSession);
  const [stage, setStage] = useState<FullSimulationStage>(
    initialSession.status === 'completed' ? 'completed' : 'preparing',
  );
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>('idle');
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readinessLabel, setReadinessLabel] = useState('Belum mendengarkan.');
  const [lastSubmittedTurnId, setLastSubmittedTurnId] = useState<string | null>(null);
  const [durationOverride, setDurationOverride] = useState(0);
  const [reviewTranscript, setReviewTranscript] = useState('');
  const [pendingReview, setPendingReview] = useState<PendingTranscriptReview | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const nonverbalCaptureRef = useRef<NonverbalFeatureCapture | null>(null);
  const nonverbalAnimationRef = useRef<number | null>(null);
  const lastTranscriptChangeRef = useRef(Date.now());
  const listeningStartedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const speechStopRef = useRef<() => void>(() => undefined);
  const liveSpeechStopRef = useRef<() => number>(() => 0);
  const currentTurn = useMemo(() => findCurrentTurn(session), [session]);
  const recognitionLanguage = session.targetApplication.language === 'en' ? 'en-US' : 'id-ID';
  const speech = useQuestionSpeech(recognitionLanguage);
  const liveSpeech = useLiveSpeechRecognition();
  const canStartInterview = microphoneState === 'ready' && speechRecognitionSupported;
  const submittedTurn =
    session.turns.find((turn) => turn.id === lastSubmittedTurnId) ??
    session.turns
      .filter((turn) => turn.answerTranscript)
      .sort((a, b) => b.turnIndex - a.turnIndex)[0] ??
    null;
  const progressText = `${Math.min(
    session.completedQuestionCount + (stage === 'completed' ? 0 : 1),
    session.plannedQuestionCount,
  )} / ${session.plannedQuestionCount}`;

  useEffect(() => {
    speechStopRef.current = speech.stop;
    liveSpeechStopRef.current = liveSpeech.stop;
  });

  useEffect(() => {
    setSpeechRecognitionSupported(hasSpeechRecognitionSupport());
  }, []);

  useEffect(() => {
    return () => {
      speechStopRef.current();
      liveSpeechStopRef.current();
      if (nonverbalAnimationRef.current !== null) {
        cancelAnimationFrame(nonverbalAnimationRef.current);
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    lastTranscriptChangeRef.current = Date.now();
  }, [liveSpeech.transcript]);

  useEffect(() => {
    if (stage !== 'completed') {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.location.assign(`/reports?sessionId=${session.id}`);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [session.id, stage]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (!video || !stream) {
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    nonverbalCaptureRef.current?.setVideo(video);
    void video.play().catch(() => undefined);
  }, [cameraState, stage]);

  useEffect(() => {
    if (stage !== 'listening') {
      return;
    }

    const interval = window.setInterval(() => {
      const cleanTranscript = liveSpeech.transcript.trim();
      if (!cleanTranscript || submittingRef.current) {
        return;
      }

      const elapsedSeconds = listeningStartedAtRef.current
        ? (Date.now() - listeningStartedAtRef.current) / 1000
        : 0;
      const enoughAnswer =
        elapsedSeconds >= minimumAnswerSeconds || wordCount(cleanTranscript) >= minimumAnswerWords;
      const silentLongEnough = Date.now() - lastTranscriptChangeRef.current >= silenceThresholdMs;
      const readiness = getReadiness(nonverbalCaptureRef.current?.readiness() ?? null, cameraState);
      setReadinessLabel(readiness.label);

      if (enoughAnswer && silentLongEnough && readiness.isReady) {
        void submitCurrentAnswer('auto');
      }
    }, 350);

    return () => window.clearInterval(interval);
  }, [cameraState, liveSpeech.transcript, stage]);

  useEffect(() => {
    if (
      stage === 'listening' &&
      cameraState === 'ready' &&
      nonverbalAnimationRef.current === null
    ) {
      startNonverbalCapture();
    }
  }, [cameraState, stage]);

  function sampleNonverbalFrame() {
    nonverbalCaptureRef.current?.sample();
    nonverbalAnimationRef.current = requestAnimationFrame(sampleNonverbalFrame);
  }

  function startNonverbalCapture() {
    if (cameraState !== 'ready' || !nonverbalCaptureRef.current) {
      return;
    }

    nonverbalCaptureRef.current.start();
    if (nonverbalAnimationRef.current !== null) {
      cancelAnimationFrame(nonverbalAnimationRef.current);
    }
    nonverbalAnimationRef.current = requestAnimationFrame(sampleNonverbalFrame);
  }

  function stopNonverbalCapture() {
    if (nonverbalAnimationRef.current !== null) {
      cancelAnimationFrame(nonverbalAnimationRef.current);
      nonverbalAnimationRef.current = null;
    }

    return nonverbalCaptureRef.current?.stop() ?? null;
  }

  async function enableCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      return;
    }

    try {
      setCameraState('loading');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          height: { ideal: 480 },
          width: { ideal: 640 },
        },
      });
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        setCameraState('error');
        return;
      }

      video.srcObject = stream;
      await video.play();
      const landmarkers = await loadNonverbalLandmarkers();
      cameraStreamRef.current = stream;
      nonverbalCaptureRef.current = new NonverbalFeatureCapture(video, landmarkers);
      setCameraState('ready');
    } catch (cameraError) {
      setCameraState(
        cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
          ? 'denied'
          : 'error',
      );
    }
  }

  async function checkMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneState('unsupported');
      return;
    }

    try {
      setMicrophoneState('checking');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneState('ready');
    } catch (microphoneError) {
      setMicrophoneState(
        microphoneError instanceof DOMException && microphoneError.name === 'NotAllowedError'
          ? 'denied'
          : 'error',
      );
    }
  }

  function beginListening() {
    setStage('listening');
    setError(null);
    setReadinessLabel('Mendengarkan jawaban.');
    setDurationOverride(0);
    liveSpeech.reset('');
    listeningStartedAtRef.current = Date.now();
    lastTranscriptChangeRef.current = Date.now();
    startNonverbalCapture();
    const started = liveSpeech.start({ language: recognitionLanguage });
    if (!started) {
      setStage('error');
      setError(
        'Speech recognition tidak tersedia atau tidak bisa dimulai. Gunakan practice mode untuk input manual.',
      );
    }
  }

  function speakQuestion(turnText: string) {
    setStage('ai_speaking');
    setError(null);
    speech.speak(turnText, beginListening);
  }

  function startSimulation() {
    if (!currentTurn) {
      setError('Sesi interview belum siap.');
      setStage('error');
      return;
    }

    speakQuestion(currentTurn.questionText);
  }

  function enterLiveRoom() {
    if (!canStartInterview) {
      setError('Cek microphone dan pastikan browser mendukung speech recognition sebelum mulai.');
      return;
    }

    setStage('ready_to_start');
    setError(null);
    window.setTimeout(startSimulation, 250);
  }

  async function sendCurrentAnswer({
    answerTranscript,
    corrections,
    durationSeconds,
    featuresForSubmit,
    rawTranscript,
    trigger,
  }: {
    answerTranscript: string;
    corrections: TranscriptCorrection[];
    durationSeconds: number;
    featuresForSubmit: NonverbalFeatures | null;
    rawTranscript: string;
    trigger: 'auto' | 'manual';
  }) {
    if (submittingRef.current) {
      return;
    }

    const cleanTranscript = answerTranscript.trim();
    if (!currentTurn || !cleanTranscript) {
      setError('Transcript belum cukup untuk disubmit.');
      setStage('error');
      return;
    }

    submittingRef.current = true;
    setStage('auto_submitting');
    setError(null);
    speech.stop();

    try {
      const response = await submitTurnAnswer(session.id, currentTurn.id, {
        answerTranscript: cleanTranscript,
        browserUserAgent: navigator.userAgent,
        durationSeconds,
        nonverbalFeatures: featuresForSubmit,
        rawTranscript,
        speechRecognitionLanguage: recognitionLanguage,
        speechRecognitionRetryCount: liveSpeech.retryCount + (trigger === 'manual' ? 1 : 0),
        speechRecognitionSource: liveSpeech.source,
        transcriptCorrections: corrections,
      });

      if (response.error) {
        setError(humanizeApiError(response.error));
        setStage('error');
        return;
      }

      const nextSession = response.data.session;
      const nextTurn = nextSession.turns.find((turn) => !turn.answerTranscript);

      setSession(nextSession);
      setLastSubmittedTurnId(response.data.turn.id);
      setPendingReview(null);
      setReviewTranscript('');

      if (nextSession.status === 'completed' || !nextTurn) {
        setStage('completed');
        return;
      }

      setStage('next_question');
      liveSpeech.reset('');
      window.setTimeout(() => speakQuestion(nextTurn.questionText), 450);
    } finally {
      submittingRef.current = false;
    }
  }

  async function submitCurrentAnswer(trigger: 'auto' | 'manual') {
    if (submittingRef.current) {
      return;
    }

    const rawTranscript = liveSpeech.transcript.trim();
    if (!currentTurn || !rawTranscript) {
      setError('Transcript belum cukup untuk disubmit.');
      setStage('error');
      return;
    }

    speech.stop();
    const durationSeconds =
      liveSpeech.stop() ||
      durationOverride ||
      (listeningStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - listeningStartedAtRef.current) / 1000))
        : 1);
    setDurationOverride(durationSeconds);
    listeningStartedAtRef.current = null;
    const featuresForSubmit = stopNonverbalCapture();
    const correctionResult = applyTranscriptCorrections(rawTranscript, session.targetApplication);

    if (shouldReviewTranscriptCorrection(correctionResult)) {
      setPendingReview({
        corrections: correctionResult.corrections,
        durationSeconds,
        featuresForSubmit,
        rawTranscript: correctionResult.rawTranscript,
      });
      setReviewTranscript(correctionResult.correctedTranscript);
      setStage('review_transcript');
      setError(null);
      return;
    }

    await sendCurrentAnswer({
      answerTranscript: correctionResult.correctedTranscript,
      corrections: correctionResult.corrections,
      durationSeconds,
      featuresForSubmit,
      rawTranscript: correctionResult.rawTranscript,
      trigger,
    });
  }

  async function submitReviewedTranscript(answerTranscript: string, useCorrections: boolean) {
    if (!pendingReview) {
      setError('Review transcript tidak tersedia.');
      setStage('error');
      return;
    }

    await sendCurrentAnswer({
      answerTranscript,
      corrections: useCorrections ? pendingReview.corrections : [],
      durationSeconds: pendingReview.durationSeconds,
      featuresForSubmit: pendingReview.featuresForSubmit,
      rawTranscript: pendingReview.rawTranscript,
      trigger: 'manual',
    });
  }

  function abortSimulation() {
    speech.stop();
    liveSpeech.stop();
    stopNonverbalCapture();
    window.location.assign('/interview');
  }

  if (!currentTurn && stage !== 'completed') {
    return (
      <Card className="p-6">
        <Badge tone="warning">Full simulation</Badge>
        <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold">
          Pertanyaan belum tersedia
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Mulai ulang setup interview agar turn pertama dibuat oleh backend.
        </p>
      </Card>
    );
  }

  if (stage === 'preparing') {
    return (
      <main className="simulation-stage relative isolate min-h-[100dvh] overflow-x-hidden px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_10%,rgb(201_214_107_/_0.22),transparent_30rem),radial-gradient(circle_at_82%_22%,rgb(18_60_55_/_0.14),transparent_32rem)]" />
        <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl content-center gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(390px,0.62fr)] lg:items-center">
          <section className="simulation-rise">
            <Badge tone="primary">Full simulation</Badge>
            <h1 className="mt-5 max-w-4xl font-[var(--font-jakarta)] text-[clamp(2.7rem,6vw,5.4rem)] font-black leading-[0.96] tracking-[-0.045em] text-[var(--foreground)]">
              Siapkan ruang interview sebelum mulai.
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg font-semibold leading-8 text-[var(--muted)]">
              Pastikan microphone aktif. Kamera bersifat opsional dan hanya dipakai untuk membaca
              sinyal kesiapan, bukan menyimpan video.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button disabled={!canStartInterview} onClick={enterLiveRoom} size="lg" type="button">
                Start interview
              </Button>
              <Button href="/interview" size="lg" type="button" variant="outline">
                Kembali ke setup
              </Button>
            </div>
            <p className="mt-4 min-h-6 text-sm font-semibold leading-6 text-[var(--muted)]">
              {error ??
                (canStartInterview
                  ? 'Perangkat utama siap. Pertanyaan akan dibacakan setelah interview dimulai.'
                  : 'Cek microphone terlebih dahulu untuk mengaktifkan tombol start.')}
            </p>
          </section>

          <section className="simulation-rise rounded-[28px] border border-white/70 bg-white/62 p-5 shadow-[0_28px_90px_rgb(18_60_55_/_0.12)] backdrop-blur">
            <div className="grid gap-4">
              <div className="rounded-[22px] border border-[rgb(18_60_55_/_0.1)] bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--foreground)]">Microphone</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
                      {microphoneStatusLabel(microphoneState)}
                    </p>
                  </div>
                  <Badge tone={microphoneState === 'ready' ? 'success' : 'neutral'}>
                    {microphoneState === 'ready' ? 'Ready' : 'Required'}
                  </Badge>
                </div>
                <Button
                  className="mt-4 w-full"
                  isLoading={microphoneState === 'checking'}
                  onClick={() => void checkMicrophone()}
                  type="button"
                  variant={microphoneState === 'ready' ? 'outline' : 'primary'}
                >
                  Cek microphone
                </Button>
              </div>

              <div className="rounded-[22px] border border-[rgb(18_60_55_/_0.1)] bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--foreground)]">Camera readiness</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
                      {cameraStatusLabel(cameraState)}
                    </p>
                  </div>
                  <Badge tone={cameraState === 'ready' ? 'success' : 'neutral'}>Optional</Badge>
                </div>
                <div className="mt-4 overflow-hidden rounded-[18px] border border-[rgb(18_60_55_/_0.12)] bg-[var(--surface-muted)]">
                  <video
                    aria-label="Preview kamera sebelum full simulation"
                    className={cn(
                      'aspect-[4/3] w-full object-cover',
                      cameraState === 'ready' ? 'opacity-100' : 'opacity-20',
                    )}
                    muted
                    playsInline
                    ref={videoRef}
                  />
                </div>
                <Button
                  className="mt-4 w-full"
                  isLoading={cameraState === 'loading'}
                  onClick={() => void enableCamera()}
                  type="button"
                  variant="outline"
                >
                  Cek camera
                </Button>
              </div>

              <div className="grid gap-3 rounded-[22px] border border-[rgb(18_60_55_/_0.1)] bg-white/70 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-black text-[var(--foreground)]">Speech recognition</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
                    {speechRecognitionSupported
                      ? 'Browser mendukung transcript real-time.'
                      : 'Browser belum mendukung speech recognition.'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--foreground)]">Text to speech</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">
                    {speech.isSupported
                      ? `Voice siap untuk ${recognitionLanguage}.`
                      : 'TTS tidak tersedia; interview tetap bisa mendengarkan jawaban.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="simulation-stage relative isolate min-h-[100dvh] overflow-x-hidden px-5 py-5 sm:px-8 lg:px-10 lg:py-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgb(201_214_107_/_0.24),transparent_32rem),radial-gradient(circle_at_88%_18%,rgb(18_60_55_/_0.16),transparent_30rem)]" />
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col">
        <header className="simulation-rise flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(18_60_55_/_0.12)] pb-4">
          <div>
            <p className="text-sm font-black tracking-[-0.02em] text-[var(--primary)]">
              Intervue live simulation
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              {session.targetApplication.role}
              {session.targetApplication.company ? ` at ${session.targetApplication.company}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-2 shadow-[0_12px_40px_rgb(18_60_55_/_0.08)] backdrop-blur">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                stage === 'listening'
                  ? 'simulation-dot bg-[var(--success)]'
                  : 'bg-[var(--primary-muted)]',
              )}
            />
            <span className="text-xs font-bold text-[var(--foreground)]">{stageLabel(stage)}</span>
            <span className="text-xs font-semibold text-[var(--muted)]">{progressText}</span>
          </div>
        </header>

        <section className="grid flex-1 content-center gap-5 py-6 lg:gap-6 lg:py-7">
          <div className="simulation-rise max-w-5xl">
            <Badge tone={stage === 'completed' ? 'success' : 'primary'}>{progressText}</Badge>
            <h1 className="mt-4 max-w-5xl text-balance font-[var(--font-jakarta)] text-[clamp(2.25rem,5vw,4.7rem)] font-black leading-[0.94] tracking-[-0.045em] text-[var(--foreground)]">
              {liveHeadline(stage)}
            </h1>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px] lg:items-stretch">
            <section className="simulation-rise rounded-[24px] border border-white/70 bg-white/58 p-5 shadow-[0_24px_70px_rgb(18_60_55_/_0.1)] backdrop-blur">
              <div className="flex min-h-[132px] flex-col justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Live transcript
                  </p>
                  <p className="mt-3 max-w-[68ch] text-lg font-semibold leading-7 text-[var(--foreground)] sm:text-xl sm:leading-8">
                    {stage === 'review_transcript'
                      ? 'Ada beberapa koreksi transcript yang perlu dicek sebelum jawaban dikirim.'
                      : liveSpeech.transcript ||
                        (stage === 'listening'
                          ? 'Transcript akan muncul saat kamu berbicara.'
                          : 'Transcript percakapan akan muncul di sini.')}
                  </p>
                  {stage === 'review_transcript' ? (
                    <textarea
                      className="mt-4 min-h-28 w-full resize-y rounded-[18px] border border-[var(--input-border)] bg-white/80 px-4 py-3 text-base font-semibold leading-7 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgb(13_77_77_/_0.12)]"
                      onChange={(event) => setReviewTranscript(event.target.value)}
                      value={reviewTranscript}
                    />
                  ) : null}
                </div>
                <p className="text-sm font-semibold leading-6 text-[var(--muted)]">
                  {stage === 'review_transcript' && pendingReview
                    ? `${pendingReview.corrections.length} koreksi terdeteksi dari konteks target lamaran.`
                    : stage === 'listening'
                      ? readinessLabel
                      : 'Feedback detail muncul di report akhir.'}
                </p>
              </div>
            </section>

            <div className="simulation-rise grid justify-items-center gap-3 rounded-[24px] border border-white/70 bg-[var(--primary)] p-5 text-white shadow-[0_28px_80px_rgb(18_60_55_/_0.22)]">
              <div
                aria-hidden="true"
                className={cn(
                  'simulation-orb grid h-24 w-24 place-items-center rounded-full bg-white/14',
                  stage === 'listening' && 'simulation-orb-active',
                )}
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/18">
                  <div className="h-7 w-7 rounded-full bg-white/72" />
                </div>
              </div>
              <div className="flex h-8 items-center gap-1.5">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'simulation-wave h-3 w-1.5 rounded-full bg-white/70',
                      stage !== 'listening' && 'opacity-35',
                    )}
                    key={index}
                    style={{ animationDelay: `${index * 90}ms` }}
                  />
                ))}
              </div>
              <p className="text-center text-[11px] font-semibold leading-5 text-white/76">
                {cameraState === 'ready'
                  ? 'Kamera aktif untuk readiness signal.'
                  : 'Kamera opsional. Mode tetap berjalan tanpa video.'}
              </p>
            </div>
          </div>

          <div className="simulation-rise flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              {stage === 'listening' ? (
                <Button onClick={() => void submitCurrentAnswer('manual')} type="button">
                  Selesai jawab
                </Button>
              ) : null}
              {stage === 'review_transcript' && pendingReview ? (
                <>
                  <Button
                    onClick={() => void submitReviewedTranscript(reviewTranscript, true)}
                    type="button"
                  >
                    Kirim jawaban
                  </Button>
                  <Button
                    onClick={() =>
                      void submitReviewedTranscript(pendingReview.rawTranscript, false)
                    }
                    type="button"
                    variant="outline"
                  >
                    Gunakan versi asli
                  </Button>
                </>
              ) : null}
              {stage === 'ai_speaking' && currentTurn ? (
                <Button
                  onClick={() => {
                    speech.stop();
                    speakQuestion(currentTurn.questionText);
                  }}
                  type="button"
                  variant="outline"
                >
                  Ulangi suara interviewer
                </Button>
              ) : null}
              {stage === 'error' ? (
                <Button onClick={startSimulation} type="button">
                  Coba lagi
                </Button>
              ) : null}
              <Button onClick={abortSimulation} type="button" variant="ghost">
                Akhiri sesi
              </Button>
            </div>
            <div className="text-sm font-semibold leading-6 text-[var(--muted)]">
              {error ??
                (speech.state === 'unsupported'
                  ? 'Text-to-speech tidak tersedia; sistem tetap lanjut ke microphone.'
                  : `Voice ${recognitionLanguage}, ${wordCount(liveSpeech.transcript)} kata`)}
            </div>
          </div>

          {stage === 'completed' && submittedTurn ? (
            <Card className="simulation-rise p-5">
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <ScoreMeter
                  label="Answer score"
                  value={submittedTurn.evaluation?.answerScore ?? 0}
                />
                <div>
                  <h2 className="font-[var(--font-jakarta)] text-xl font-black">
                    Jawaban terakhir tersimpan
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Report akhir akan menampilkan skor Gemini, baseline speech, dan sinyal
                    non-verbal yang tersedia.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </section>

        <video
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0"
          muted
          playsInline
          ref={videoRef}
        />
      </div>
    </main>
  );
}
