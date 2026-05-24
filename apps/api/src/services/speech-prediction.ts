import type { SpeechRecognitionSource } from '@prisma/client';

export type SpeechPredictionInput = {
  transcript: string;
  durationSeconds: number;
  retryCount: number;
  source: SpeechRecognitionSource;
};

export type SpeechPredictionOutput = {
  deliveryQuality: number;
  fluencyScore: number;
  confidenceSignal: number;
  speechPredictionLabel: string;
  speechPredictionModelName: string;
  speechPredictionModelVersion: string;
};

const fillerWords = new Set([
  'anu',
  'eee',
  'ee',
  'em',
  'emm',
  'hmm',
  'kayak',
  'mungkin',
  'um',
  'umm',
  'uh',
  'ya',
]);

function clampScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function countWords(transcript: string) {
  return transcript
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function predictSpeechSignals(input: SpeechPredictionInput): SpeechPredictionOutput {
  const words = countWords(input.transcript);
  const wordCount = words.length;
  const durationMinutes = Math.max(input.durationSeconds, 1) / 60;
  const wordsPerMinute = wordCount / durationMinutes;
  const fillerCount = words.filter((word) =>
    fillerWords.has(word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')),
  ).length;
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;
  const lengthScore = clampScore((wordCount / 55) * 100);
  const pacePenalty = Math.min(35, Math.abs(wordsPerMinute - 125) * 0.28);
  const fillerPenalty = Math.min(35, fillerRatio * 180);
  const retryPenalty = Math.min(20, input.retryCount * 6);
  const manualPenalty = input.source === 'manual' ? 5 : 0;

  const fluencyScore = clampScore(88 - pacePenalty - fillerPenalty - retryPenalty - manualPenalty);
  const confidenceSignal = clampScore(
    72 + lengthScore * 0.18 - retryPenalty - fillerPenalty * 0.55 - manualPenalty,
  );
  const deliveryQuality = clampScore((fluencyScore + confidenceSignal + lengthScore) / 3);
  const speechPredictionLabel =
    deliveryQuality >= 80 ? 'strong' : deliveryQuality >= 60 ? 'developing' : 'needs_practice';

  return {
    deliveryQuality,
    fluencyScore,
    confidenceSignal,
    speechPredictionLabel,
    speechPredictionModelName: 'phase6-baseline',
    speechPredictionModelVersion: '0.1.0',
  };
}
