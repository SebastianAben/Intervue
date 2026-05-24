import type { Prisma, QuestionType } from '@prisma/client';
import type { DimensionScores, SessionReportTurnSummary, SpeechSummary } from '@intervue/shared';

export class ReportGenerationError extends Error {
  constructor(message = 'Report could not be generated from completed session data.') {
    super(message);
    this.name = 'ReportGenerationError';
  }
}

const dimensionKeys = [
  'relevance',
  'structure',
  'depth',
  'impact',
  'verbalCommunication',
  'professionalism',
  'confidenceSignal',
] as const satisfies ReadonlyArray<keyof DimensionScores>;

type ReportTurnInput = {
  id: string;
  turnIndex: number;
  questionText: string;
  questionType: QuestionType;
  answerTranscript: string | null;
  durationSeconds: number | null;
  deliveryQuality: number | null;
  fluencyScore: number | null;
  confidenceSignal: number | null;
  speechPredictionLabel: string | null;
  nonverbalScore: number | null;
  evaluation: {
    answerScore: number;
    dimensionScores: Prisma.JsonValue;
    strengths: Prisma.JsonValue;
    improvements: Prisma.JsonValue;
    betterAnswerExample: string;
    followUpQuestion: string | null;
  } | null;
};

export type GeneratedSessionReport = {
  overallScore: number;
  dimensionSummary: DimensionScores;
  speechSummary: SpeechSummary;
  strengths: string[];
  improvementPriorities: string[];
  recommendations: string[];
  turns: SessionReportTurnSummary[];
};

function roundScore(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

function average(values: Array<number | null | undefined>) {
  const numericValues = values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  if (numericValues.length === 0) {
    return null;
  }

  return roundScore(
    numericValues.reduce((total, value) => total + value, 0) / numericValues.length,
  );
}

function parseStringArray(value: Prisma.JsonValue) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseDimensionScores(value: Prisma.JsonValue): DimensionScores {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReportGenerationError(
      'Report generation failed because dimension scores are missing.',
    );
  }

  const dimensionRecord = value as Partial<Record<keyof DimensionScores, unknown>>;
  const parsed: Partial<DimensionScores> = {};

  for (const key of dimensionKeys) {
    const score = dimensionRecord[key];

    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new ReportGenerationError(`Report generation failed because ${key} score is missing.`);
    }

    parsed[key] = roundScore(score);
  }

  return parsed as DimensionScores;
}

function deduplicateText(values: string[], limit: number) {
  const seen = new Set<string>();
  const deduplicated: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduplicated.push(normalized);

    if (deduplicated.length >= limit) {
      break;
    }
  }

  return deduplicated;
}

function summarizeDimensions(turns: SessionReportTurnSummary[]): DimensionScores {
  const summary: Partial<DimensionScores> = {};

  for (const key of dimensionKeys) {
    summary[key] = average(turns.map((turn) => turn.dimensionScores[key])) ?? 0;
  }

  return summary as DimensionScores;
}

function summarizeSpeech(turns: SessionReportTurnSummary[]): SpeechSummary {
  const labelDistribution: Record<string, number> = {};

  for (const turn of turns) {
    if (!turn.speechPredictionLabel) {
      continue;
    }

    labelDistribution[turn.speechPredictionLabel] =
      (labelDistribution[turn.speechPredictionLabel] ?? 0) + 1;
  }

  return {
    deliveryQuality: average(turns.map((turn) => turn.deliveryQuality)),
    fluencyScore: average(turns.map((turn) => turn.fluencyScore)),
    confidenceSignal: average(turns.map((turn) => turn.confidenceSignal)),
    labelDistribution,
  };
}

function buildRecommendations(
  dimensionSummary: DimensionScores,
  improvementPriorities: string[],
  speechSummary: SpeechSummary,
) {
  const recommendations: string[] = [];
  const weakestDimensions = [...dimensionKeys]
    .sort((left, right) => dimensionSummary[left] - dimensionSummary[right])
    .slice(0, 3);

  for (const dimension of weakestDimensions) {
    if (dimensionSummary[dimension] >= 70) {
      continue;
    }

    const label =
      dimension === 'verbalCommunication'
        ? 'verbal communication'
        : dimension === 'confidenceSignal'
          ? 'confidence signal'
          : dimension;
    recommendations.push(`Prioritize ${label}; it is currently the weakest scoring dimension.`);
  }

  if (speechSummary.fluencyScore !== null && speechSummary.fluencyScore < 65) {
    recommendations.push('Practice concise answers at a steady pace before the next simulation.');
  }

  recommendations.push(...improvementPriorities.slice(0, 2));

  return deduplicateText(
    recommendations.length > 0
      ? recommendations
      : ['Keep practicing with measurable examples and clearer answer structure.'],
    5,
  );
}

export function generateSessionReportFromTurns(turns: ReportTurnInput[]): GeneratedSessionReport {
  const answeredTurns = turns
    .filter((turn) => turn.answerTranscript !== null)
    .sort((left, right) => left.turnIndex - right.turnIndex);

  if (answeredTurns.length === 0) {
    throw new ReportGenerationError(
      'Report generation failed because there are no answered turns.',
    );
  }

  const turnSummaries = answeredTurns.map((turn): SessionReportTurnSummary => {
    if (!turn.answerTranscript || !turn.evaluation) {
      throw new ReportGenerationError(
        'Report generation failed because an answered turn is missing evaluation data.',
      );
    }

    return {
      turnId: turn.id,
      turnIndex: turn.turnIndex,
      questionText: turn.questionText,
      questionType: turn.questionType,
      answerTranscript: turn.answerTranscript,
      durationSeconds: turn.durationSeconds,
      answerScore: roundScore(turn.evaluation.answerScore),
      dimensionScores: parseDimensionScores(turn.evaluation.dimensionScores),
      deliveryQuality: turn.deliveryQuality,
      fluencyScore: turn.fluencyScore,
      confidenceSignal: turn.confidenceSignal,
      speechPredictionLabel: turn.speechPredictionLabel,
      nonverbalScore: turn.nonverbalScore,
      strengths: parseStringArray(turn.evaluation.strengths),
      improvements: parseStringArray(turn.evaluation.improvements),
      betterAnswerExample: turn.evaluation.betterAnswerExample,
      followUpQuestion: turn.evaluation.followUpQuestion,
    };
  });

  const overallScore = average(turnSummaries.map((turn) => turn.answerScore)) ?? 0;
  const dimensionSummary = summarizeDimensions(turnSummaries);
  const speechSummary = summarizeSpeech(turnSummaries);
  const strengths = deduplicateText(
    turnSummaries.flatMap((turn) => turn.strengths),
    6,
  );
  const improvementPriorities = deduplicateText(
    turnSummaries.flatMap((turn) => turn.improvements),
    6,
  );
  const recommendations = buildRecommendations(
    dimensionSummary,
    improvementPriorities,
    speechSummary,
  );

  return {
    overallScore,
    dimensionSummary,
    speechSummary,
    strengths,
    improvementPriorities,
    recommendations,
    turns: turnSummaries,
  };
}
