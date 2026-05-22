'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  InterviewSessionDetail,
  NonverbalFeatures,
  SpeechRecognitionSource,
  TranscriptCorrection,
} from '@intervue/shared';
import { applyTranscriptCorrections } from '@intervue/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RecordingButton } from '@/components/voice/recording-button';
import { ScoreMeter } from '@/components/voice/score-meter';
import { StatusChip, type VoiceStatus } from '@/components/voice/status-chip';
import { WaveformIndicator } from '@/components/voice/waveform-indicator';
import { submitTurnAnswer } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { FullSimulationRoom } from './full-simulation-room';
import { loadNonverbalLandmarkers, NonverbalFeatureCapture } from './nonverbal-feature-capture';

type InterviewRoomState =
  | 'idle'
  | 'listening'
  | 'review'
  | 'submitting'
  | 'submitted'
  | 'speechUnsupported'
  | 'micDenied'
  | 'error';

type CameraState = 'idle' | 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';
type QuestionSpeechState = 'idle' | 'speaking' | 'unsupported';

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  const speechWindow = window as WindowWithSpeechRecognition;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function findCurrentTurn(session: InterviewSessionDetail) {
  return session.turns.find((turn) => !turn.answerTranscript) ?? session.turns[0] ?? null;
}

function voiceStatusFromRoomState(state: InterviewRoomState): VoiceStatus {
  if (state === 'listening') {
    return 'recording';
  }

  if (state === 'submitting') {
    return 'analyzing';
  }

  if (state === 'error' || state === 'micDenied') {
    return 'error';
  }

  if (state === 'review' || state === 'speechUnsupported') {
    return 'transcribing';
  }

  return 'ready';
}

function stateLabel(state: InterviewRoomState) {
  const labels: Record<InterviewRoomState, string> = {
    error: 'Terjadi kendala saat memproses jawaban.',
    idle: 'Siap merekam jawaban.',
    listening: 'Mendengarkan jawaban dari mikrofon.',
    micDenied: 'Izin mikrofon ditolak. Gunakan input teks manual.',
    review: 'Review dan edit transcript sebelum submit.',
    speechUnsupported: 'Speech recognition tidak tersedia. Gunakan input teks manual.',
    submitted: 'Jawaban tersimpan dan feedback AI tersedia.',
    submitting: 'Menyimpan transcript dan metadata.',
  };

  return labels[state];
}

function cameraStateLabel(state: CameraState) {
  const labels: Record<CameraState, string> = {
    denied: 'Izin kamera ditolak. Interview tetap bisa berjalan tanpa skor non-verbal.',
    error: 'Kamera atau model MediaPipe belum bisa dimuat.',
    idle: 'Aktifkan kamera jika ingin memakai skor non-verbal.',
    loading: 'Menyiapkan kamera dan model MediaPipe.',
    ready: 'Kamera siap. Fitur non-verbal akan diekstrak saat rekaman.',
    unsupported: 'Browser tidak mendukung akses kamera.',
  };

  return labels[state];
}

function canUseQuestionSpeech() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function InterviewRoom({ initialSession }: { initialSession: InterviewSessionDetail }) {
  if (initialSession.mode === 'full_simulation') {
    return <FullSimulationRoom initialSession={initialSession} />;
  }

  return <PracticeInterviewRoom initialSession={initialSession} />;
}

function PracticeInterviewRoom({ initialSession }: { initialSession: InterviewSessionDetail }) {
  const [session, setSession] = useState(initialSession);
  const [roomState, setRoomState] = useState<InterviewRoomState>(
    findCurrentTurn(initialSession)?.answerTranscript ? 'submitted' : 'idle',
  );
  const [transcript, setTranscript] = useState(
    findCurrentTurn(initialSession)?.answerTranscript ?? '',
  );
  const [rawTranscript, setRawTranscript] = useState(
    findCurrentTurn(initialSession)?.rawTranscript ??
      findCurrentTurn(initialSession)?.answerTranscript ??
      '',
  );
  const [transcriptCorrections, setTranscriptCorrections] = useState<TranscriptCorrection[]>(
    findCurrentTurn(initialSession)?.transcriptCorrections ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedTurnId, setLastSubmittedTurnId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [source, setSource] = useState<SpeechRecognitionSource>('web_speech_api');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [questionSpeechState, setQuestionSpeechState] = useState<QuestionSpeechState>('idle');
  const [nonverbalFeatures, setNonverbalFeatures] = useState<NonverbalFeatures | null>(
    findCurrentTurn(initialSession)?.nonverbalFeatures ?? null,
  );
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(
    findCurrentTurn(initialSession)?.durationSeconds ?? 0,
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const questionUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const nonverbalCaptureRef = useRef<NonverbalFeatureCapture | null>(null);
  const nonverbalAnimationRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const currentTurn = useMemo(() => {
    if (roomState === 'submitted' && lastSubmittedTurnId) {
      return (
        session.turns.find((turn) => turn.id === lastSubmittedTurnId) ?? findCurrentTurn(session)
      );
    }

    return findCurrentTurn(session);
  }, [lastSubmittedTurnId, roomState, session]);
  const submittedTurn = session.turns.find((turn) => turn.id === currentTurn?.id) ?? currentTurn;
  const nextTurn = session.turns.find((turn) => !turn.answerTranscript) ?? null;
  const recognitionLanguage = session.targetApplication.language === 'en' ? 'en-US' : 'id-ID';

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (nonverbalAnimationRef.current !== null) {
        cancelAnimationFrame(nonverbalAnimationRef.current);
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (canUseQuestionSpeech()) {
      window.speechSynthesis.cancel();
    }
    questionUtteranceRef.current = null;
    setQuestionSpeechState('idle');
  }, [currentTurn?.id]);

  function sampleNonverbalFrame() {
    nonverbalCaptureRef.current?.sample();
    nonverbalAnimationRef.current = requestAnimationFrame(sampleNonverbalFrame);
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
          height: {
            ideal: 480,
          },
          width: {
            ideal: 640,
          },
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
      startNonverbalCapture(true);
    } catch (cameraError) {
      setCameraState(
        cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
          ? 'denied'
          : 'error',
      );
    }
  }

  function startNonverbalCapture(force = false) {
    if ((!force && cameraState !== 'ready') || !nonverbalCaptureRef.current) {
      return;
    }

    setNonverbalFeatures(null);
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

    const features = nonverbalCaptureRef.current?.stop() ?? null;
    setNonverbalFeatures(features);
    return features;
  }

  function stopQuestionSpeech() {
    if (!canUseQuestionSpeech()) {
      setQuestionSpeechState('unsupported');
      return;
    }

    window.speechSynthesis.cancel();
    questionUtteranceRef.current = null;
    setQuestionSpeechState('idle');
  }

  function speakCurrentQuestion() {
    if (!currentTurn) {
      return;
    }

    if (!canUseQuestionSpeech()) {
      setQuestionSpeechState('unsupported');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentTurn.questionText);
    utterance.lang = recognitionLanguage;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (questionUtteranceRef.current === utterance) {
        questionUtteranceRef.current = null;
        setQuestionSpeechState('idle');
      }
    };
    utterance.onerror = () => {
      if (questionUtteranceRef.current === utterance) {
        questionUtteranceRef.current = null;
        setQuestionSpeechState('idle');
      }
    };

    questionUtteranceRef.current = utterance;
    setQuestionSpeechState('speaking');
    window.speechSynthesis.speak(utterance);
  }

  function switchToManual(nextState: InterviewRoomState) {
    setSource('manual');
    setRoomState(nextState);
    setStartedAt(null);
    startedAtRef.current = null;
    startNonverbalCapture();
  }

  function startRecording() {
    setError(null);
    stopQuestionSpeech();

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      switchToManual('speechUnsupported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLanguage;
    recognitionRef.current = recognition;
    startedAtRef.current = Date.now();
    setSource('web_speech_api');
    setStartedAt(startedAtRef.current);
    setRoomState('listening');
    startNonverbalCapture();

    let finalTranscript = transcript.trim();

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const spokenText = result[0]?.transcript ?? '';

        if (result.isFinal) {
          finalTranscript = `${finalTranscript} ${spokenText}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${spokenText}`.trim();
        }
      }

      const nextRawTranscript = `${finalTranscript} ${interimTranscript}`.trim();
      const correctionResult = applyTranscriptCorrections(
        nextRawTranscript,
        session.targetApplication,
      );
      setRawTranscript(correctionResult.rawTranscript);
      setTranscript(correctionResult.correctedTranscript);
      setTranscriptCorrections(correctionResult.corrections);
    };

    recognition.onerror = (event) => {
      setRetryCount((value) => value + 1);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        switchToManual('micDenied');
        return;
      }

      setError('Speech recognition berhenti. Kamu bisa coba rekam ulang atau pakai input manual.');
      switchToManual('error');
    };

    recognition.onend = () => {
      if (startedAtRef.current) {
        setDurationSeconds(Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)));
      }
      startedAtRef.current = null;
      setRoomState((value) => (value === 'listening' ? 'review' : value));
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setRetryCount((value) => value + 1);
      setError('Speech recognition tidak bisa dimulai. Gunakan input teks manual.');
      switchToManual('error');
    }
  }

  function stopRecording() {
    const elapsed = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    setDurationSeconds(elapsed);
    startedAtRef.current = null;
    stopNonverbalCapture();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRoomState('review');
  }

  async function submitAnswer() {
    if (submittingRef.current) {
      return;
    }

    if (!currentTurn) {
      setError('Turn interview tidak ditemukan.');
      setRoomState('error');
      return;
    }

    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) {
      setError('Transcript wajib diisi sebelum submit.');
      setRoomState('review');
      return;
    }

    setRoomState('submitting');
    setError(null);
    stopQuestionSpeech();
    submittingRef.current = true;
    const featuresForSubmit = nonverbalFeatures ?? stopNonverbalCapture();
    if (featuresForSubmit) {
      setNonverbalFeatures(featuresForSubmit);
    }

    try {
      const response = await submitTurnAnswer(session.id, currentTurn.id, {
        answerTranscript: cleanTranscript,
        browserUserAgent: navigator.userAgent,
        durationSeconds: durationSeconds || 1,
        nonverbalFeatures: featuresForSubmit,
        rawTranscript: rawTranscript || cleanTranscript,
        speechRecognitionLanguage: recognitionLanguage,
        speechRecognitionRetryCount: retryCount,
        speechRecognitionSource: source,
        transcriptCorrections,
      });

      if (response.error) {
        setError(response.error.message);
        setRoomState('error');
        return;
      }

      setSession(response.data.session);
      setTranscript(response.data.turn.answerTranscript ?? cleanTranscript);
      setRawTranscript(response.data.turn.rawTranscript ?? rawTranscript);
      setTranscriptCorrections(response.data.turn.transcriptCorrections);
      setLastSubmittedTurnId(response.data.turn.id);
      setRoomState('submitted');
    } finally {
      submittingRef.current = false;
    }
  }

  function continueToNextQuestion() {
    if (!nextTurn) {
      return;
    }

    stopQuestionSpeech();
    setTranscript(nextTurn.answerTranscript ?? '');
    setRawTranscript(nextTurn.rawTranscript ?? nextTurn.answerTranscript ?? '');
    setTranscriptCorrections(nextTurn.transcriptCorrections);
    setDurationSeconds(nextTurn.durationSeconds ?? 0);
    setRetryCount(0);
    setSource('web_speech_api');
    setNonverbalFeatures(nextTurn.nonverbalFeatures);
    setLastSubmittedTurnId(null);
    setRoomState('idle');
    setError(null);
  }

  if (!currentTurn) {
    return (
      <Card className="p-6">
        <Badge tone="warning">Session aktif</Badge>
        <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold">
          Pertanyaan belum tersedia
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Mulai ulang setup interview agar turn pertama dibuat oleh backend.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-5">
        <Card className="overflow-hidden p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge tone="primary">Pertanyaan {currentTurn.turnIndex}</Badge>
              <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold leading-tight text-[var(--foreground)]">
                {currentTurn.questionText}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Jawab dengan suara atau input manual. Audio mentah tidak disimpan; backend hanya
                menerima transcript, durasi, metadata ringan, dan fitur non-verbal numerik jika
                kamera diaktifkan.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  aria-pressed={questionSpeechState === 'speaking'}
                  disabled={questionSpeechState === 'unsupported'}
                  onClick={
                    questionSpeechState === 'speaking' ? stopQuestionSpeech : speakCurrentQuestion
                  }
                  type="button"
                  variant="outline"
                >
                  {questionSpeechState === 'speaking' ? 'Hentikan Suara' : 'Dengarkan Pertanyaan'}
                </Button>
                {questionSpeechState === 'unsupported' ? (
                  <span className="text-sm font-semibold text-[var(--muted)]">
                    Text-to-speech tidak tersedia di browser ini.
                  </span>
                ) : null}
              </div>
            </div>
            <StatusChip status={voiceStatusFromRoomState(roomState)} />
          </div>

          <div className="mt-8 rounded-[var(--radius-lg)] bg-[var(--surface-muted)] p-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <WaveformIndicator active={roomState === 'listening'} bars={28} />
              <RecordingButton
                disabled={roomState === 'submitting' || roomState === 'submitted'}
                isRecording={roomState === 'listening'}
                label={roomState === 'listening' ? 'Hentikan rekaman' : 'Mulai rekaman'}
                onClick={roomState === 'listening' ? stopRecording : startRecording}
              />
              <p className="max-w-lg text-sm font-semibold leading-6 text-[var(--muted)]">
                {stateLabel(roomState)}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  disabled={roomState === 'listening' || roomState === 'submitting'}
                  onClick={() => switchToManual('review')}
                  type="button"
                  variant="outline"
                >
                  Pakai Input Manual
                </Button>
                <Button
                  disabled={roomState === 'listening' || roomState === 'submitting'}
                  onClick={() => {
                    setTranscript('');
                    setRawTranscript('');
                    setTranscriptCorrections([]);
                    setNonverbalFeatures(null);
                    setLastSubmittedTurnId(null);
                    setRetryCount((value) => value + 1);
                    setRoomState('idle');
                  }}
                  type="button"
                  variant="ghost"
                >
                  Reset Transcript
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[var(--radius-md)] bg-black">
              <video
                aria-label="Preview kamera untuk ekstraksi fitur non-verbal"
                className="aspect-[4/3] h-full w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
            </div>
            <div>
              <Badge tone={cameraState === 'ready' ? 'success' : 'neutral'}>Non-verbal ML</Badge>
              <h3 className="mt-3 font-[var(--font-jakarta)] text-xl font-extrabold">
                Kamera opsional
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Raw video tidak disimpan. Browser hanya mengekstrak fitur numerik seperti deteksi
                wajah, gerak kepala, mulut, bahu, dan tangan untuk dikirim ke backend.
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--muted)]">
                {cameraStateLabel(cameraState)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  disabled={
                    cameraState === 'loading' ||
                    cameraState === 'ready' ||
                    roomState === 'listening'
                  }
                  isLoading={cameraState === 'loading'}
                  onClick={enableCamera}
                  type="button"
                  variant="outline"
                >
                  Aktifkan Kamera
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Textarea
            disabled={roomState === 'submitting' || roomState === 'submitted'}
            helperText="Edit transcript agar jawaban yang dikirim benar-benar sesuai ucapanmu."
            label="Transcript jawaban"
            minLength={1}
            onChange={(event) => {
              setTranscript(event.target.value);
              if (!rawTranscript) {
                setRawTranscript(event.target.value);
              }
              if (roomState !== 'listening' && roomState !== 'submitted') {
                setRoomState('review');
              }
            }}
            placeholder="Transcript dari browser akan muncul di sini, atau tulis jawaban manual."
            value={transcript}
          />
          {transcriptCorrections.length > 0 ? (
            <div className="mt-3 rounded-[var(--radius-sm)] bg-[#eef6f1] px-4 py-3 text-sm font-semibold leading-6 text-[var(--primary)]">
              Transcript dikoreksi otomatis dari Web Speech API. {transcriptCorrections.length}{' '}
              istilah disesuaikan dari konteks target lamaran.
            </div>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button href="/interview" type="button" variant="ghost">
              Setup Baru
            </Button>
            {roomState === 'submitted' && nextTurn ? (
              <Button onClick={continueToNextQuestion} type="button">
                Pertanyaan Berikutnya
              </Button>
            ) : roomState === 'submitted' && session.status === 'completed' ? (
              <Button href="/reports" type="button">
                Sesi Selesai
              </Button>
            ) : (
              <Button
                disabled={roomState === 'listening' || roomState === 'submitted'}
                isLoading={roomState === 'submitting'}
                onClick={submitAnswer}
                type="button"
              >
                Submit Jawaban
              </Button>
            )}
          </div>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="p-5">
          <Badge tone="neutral">Session</Badge>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Target', session.targetApplication.role],
              ['Mode', session.mode === 'practice' ? 'Practice' : 'Full simulation'],
              ['Bahasa', recognitionLanguage],
              ['Sumber transcript', source === 'manual' ? 'Manual' : 'Web Speech API'],
              ['Retry count', String(retryCount)],
              ['Durasi', `${durationSeconds || 0} detik`],
              [
                'Fitur non-verbal',
                nonverbalFeatures
                  ? `${Math.round(nonverbalFeatures.frame_count)} frame`
                  : 'Belum ada',
              ],
            ].map(([label, value]) => (
              <div className="flex items-start justify-between gap-4" key={label}>
                <dt className="font-semibold text-[var(--muted)]">{label}</dt>
                <dd className="text-right font-bold text-[var(--foreground)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className={cn('p-5', roomState !== 'submitted' && 'opacity-70')}>
          <Badge tone={roomState === 'submitted' ? 'success' : 'primary'}>Baseline speech</Badge>
          {submittedTurn?.deliveryQuality !== null &&
          submittedTurn?.deliveryQuality !== undefined ? (
            <div className="mt-5 space-y-5">
              <ScoreMeter label="Delivery quality" value={submittedTurn.deliveryQuality} />
              <ScoreMeter label="Fluency" value={submittedTurn.fluencyScore ?? 0} />
              <ScoreMeter label="Confidence signal" value={submittedTurn.confidenceSignal ?? 0} />
              <p className="text-sm leading-6 text-[var(--muted)]">
                Label:{' '}
                <span className="font-bold text-[var(--foreground)]">
                  {submittedTurn.speechPredictionLabel}
                </span>
                . Metrik ini menjadi sinyal pendukung untuk evaluasi Gemini.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Skor baseline muncul setelah transcript disubmit.
            </p>
          )}
        </Card>

        <Card className={cn('p-5', roomState !== 'submitted' && 'opacity-70')}>
          <Badge tone={submittedTurn?.evaluation ? 'success' : 'neutral'}>Feedback AI</Badge>
          {submittedTurn?.evaluation ? (
            <div className="mt-5 space-y-5">
              <ScoreMeter label="Answer score" value={submittedTurn.evaluation.answerScore} />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Strengths</h3>
                <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {submittedTurn.evaluation.strengths.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Improvements</h3>
                <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {submittedTurn.evaluation.improvements.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
                <span className="font-bold text-[var(--foreground)]">Contoh jawaban: </span>
                {submittedTurn.evaluation.betterAnswerExample}
              </div>
              {submittedTurn.evaluation.followUpQuestion ? (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Follow-up:{' '}
                  <span className="font-bold text-[var(--foreground)]">
                    {submittedTurn.evaluation.followUpQuestion}
                  </span>
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Feedback Gemini muncul setelah transcript disubmit dan evaluasi berhasil.
            </p>
          )}
        </Card>

        <Card className={cn('p-5', roomState !== 'submitted' && 'opacity-70')}>
          <Badge
            tone={
              submittedTurn?.nonverbalScore !== null && submittedTurn?.nonverbalScore !== undefined
                ? 'success'
                : 'neutral'
            }
          >
            Non-verbal ML
          </Badge>
          {submittedTurn?.nonverbalScore !== null && submittedTurn?.nonverbalScore !== undefined ? (
            <div className="mt-5 space-y-4">
              <ScoreMeter label="Readiness signal" value={submittedTurn.nonverbalScore} />
              <p className="text-sm leading-6 text-[var(--muted)]">
                Model:{' '}
                <span className="font-bold text-[var(--foreground)]">
                  {submittedTurn.nonverbalModelName}@{submittedTurn.nonverbalModelVersion}
                </span>
                . Skor ini hanya sinyal pendukung, bukan keputusan final.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              {submittedTurn?.nonverbalError
                ? `Inference non-verbal gagal: ${submittedTurn.nonverbalError}`
                : 'Aktifkan kamera sebelum submit untuk mengirim fitur non-verbal.'}
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
