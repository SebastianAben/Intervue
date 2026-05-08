'use client';

import { useMemo, useRef, useState } from 'react';
import type {
  InterviewSessionDetail,
  SpeechRecognitionSource,
} from '@intervue/shared';
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

type InterviewRoomState =
  | 'idle'
  | 'listening'
  | 'review'
  | 'submitting'
  | 'submitted'
  | 'speechUnsupported'
  | 'micDenied'
  | 'error';

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
    submitted: 'Jawaban tersimpan dengan baseline speech prediction.',
    submitting: 'Menyimpan transcript dan metadata.',
  };

  return labels[state];
}

export function InterviewRoom({ initialSession }: { initialSession: InterviewSessionDetail }) {
  const [session, setSession] = useState(initialSession);
  const [roomState, setRoomState] = useState<InterviewRoomState>(
    findCurrentTurn(initialSession)?.answerTranscript ? 'submitted' : 'idle',
  );
  const [transcript, setTranscript] = useState(findCurrentTurn(initialSession)?.answerTranscript ?? '');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [source, setSource] = useState<SpeechRecognitionSource>('web_speech_api');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(
    findCurrentTurn(initialSession)?.durationSeconds ?? 0,
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const currentTurn = useMemo(() => findCurrentTurn(session), [session]);
  const submittedTurn = session.turns.find((turn) => turn.id === currentTurn?.id) ?? currentTurn;
  const recognitionLanguage = session.targetApplication.language === 'en' ? 'en-US' : 'id-ID';

  function switchToManual(nextState: InterviewRoomState) {
    setSource('manual');
    setRoomState(nextState);
    setStartedAt(null);
    startedAtRef.current = null;
  }

  function startRecording() {
    setError(null);

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

      setTranscript(`${finalTranscript} ${interimTranscript}`.trim());
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
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRoomState('review');
  }

  async function submitAnswer() {
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

    const response = await submitTurnAnswer(session.id, currentTurn.id, {
      answerTranscript: cleanTranscript,
      browserUserAgent: navigator.userAgent,
      durationSeconds: durationSeconds || 1,
      speechRecognitionLanguage: recognitionLanguage,
      speechRecognitionRetryCount: retryCount,
      speechRecognitionSource: source,
    });

    if (response.error) {
      setError(response.error.message);
      setRoomState('error');
      return;
    }

    setSession(response.data.session);
    setTranscript(response.data.turn.answerTranscript ?? cleanTranscript);
    setRoomState('submitted');
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
                menerima transcript, durasi, dan metadata ringan.
              </p>
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
          <Textarea
            disabled={roomState === 'submitting' || roomState === 'submitted'}
            helperText="Edit transcript agar jawaban yang dikirim benar-benar sesuai ucapanmu."
            label="Transcript jawaban"
            minLength={1}
            onChange={(event) => {
              setTranscript(event.target.value);
              if (roomState !== 'listening' && roomState !== 'submitted') {
                setRoomState('review');
              }
            }}
            placeholder="Transcript dari browser akan muncul di sini, atau tulis jawaban manual."
            value={transcript}
          />
          {error ? (
            <p className="mt-3 rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button href="/interview" type="button" variant="ghost">
              Setup Baru
            </Button>
            <Button
              disabled={roomState === 'listening' || roomState === 'submitted'}
              isLoading={roomState === 'submitting'}
              onClick={submitAnswer}
              type="button"
            >
              Submit Jawaban
            </Button>
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
          {submittedTurn?.deliveryQuality !== null && submittedTurn?.deliveryQuality !== undefined ? (
            <div className="mt-5 space-y-5">
              <ScoreMeter label="Delivery quality" value={submittedTurn.deliveryQuality} />
              <ScoreMeter label="Fluency" value={submittedTurn.fluencyScore ?? 0} />
              <ScoreMeter label="Confidence signal" value={submittedTurn.confidenceSignal ?? 0} />
              <p className="text-sm leading-6 text-[var(--muted)]">
                Label:{' '}
                <span className="font-bold text-[var(--foreground)]">
                  {submittedTurn.speechPredictionLabel}
                </span>
                .
                Feedback AI Gemini akan ditambahkan pada Phase 7.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Skor baseline muncul setelah transcript disubmit.
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
