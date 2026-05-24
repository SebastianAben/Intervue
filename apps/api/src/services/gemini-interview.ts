import type { InterviewTurn, QuestionType, TargetApplication } from '@prisma/client';
import { z } from 'zod';
import { env } from '../config/env.js';

export class GeminiInterviewError extends Error {
  constructor(
    public readonly code: 'AI_EVALUATION_FAILED' | 'GEMINI_RATE_LIMITED',
    message: string,
  ) {
    super(message);
    this.name = 'GeminiInterviewError';
  }
}

const questionTypes = ['hr', 'behavioral', 'technical', 'case', 'follow_up'] as const;

export const interviewQuestionSchema = z.object({
  questionText: z.string().trim().min(10).max(1000),
  questionType: z.enum(questionTypes),
});

export const answerEvaluationSchema = z.object({
  answerScore: z.coerce.number().int().min(0).max(100),
  dimensionScores: z.object({
    relevance: z.coerce.number().int().min(0).max(100),
    structure: z.coerce.number().int().min(0).max(100),
    depth: z.coerce.number().int().min(0).max(100),
    impact: z.coerce.number().int().min(0).max(100),
    verbalCommunication: z.coerce.number().int().min(0).max(100),
    professionalism: z.coerce.number().int().min(0).max(100),
    confidenceSignal: z.coerce.number().int().min(0).max(100),
  }),
  strengths: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  improvements: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  betterAnswerExample: z.string().trim().min(20).max(3000),
  followUpQuestion: z.string().trim().min(10).max(1000).nullable().optional(),
});

export type InterviewQuestionOutput = z.infer<typeof interviewQuestionSchema>;
export type AnswerEvaluationOutput = z.infer<typeof answerEvaluationSchema>;

type SpeechMetrics = {
  deliveryQuality: number | null;
  fluencyScore: number | null;
  confidenceSignal: number | null;
  speechPredictionLabel: string | null;
  speechPredictionModelName: string | null;
  speechPredictionModelVersion: string | null;
  durationSeconds: number | null;
  speechRecognitionSource: string | null;
  speechRecognitionRetryCount: number;
};

type NonverbalMetrics = {
  nonverbalScore: number | null;
  nonverbalModelName: string | null;
  nonverbalModelVersion: string | null;
  nonverbalSource: string | null;
  nonverbalError: string | null;
};

export type AnswerEvaluationInput = {
  target: TargetApplication;
  turn: InterviewTurn;
  answerTranscript: string;
  speechMetrics: SpeechMetrics;
  nonverbalMetrics: NonverbalMetrics;
};

export type QuestionGenerationInput = {
  target: TargetApplication;
  previousTurns: Array<Pick<InterviewTurn, 'questionText' | 'questionType' | 'answerTranscript'>>;
  nextTurnIndex: number;
  plannedQuestionCount: number;
  preferredFollowUpQuestion?: string | null;
};

const questionResponseJsonSchema = {
  type: 'object',
  properties: {
    questionText: {
      type: 'string',
    },
    questionType: {
      type: 'string',
      enum: questionTypes,
    },
  },
  required: ['questionText', 'questionType'],
} as const;

const evaluationResponseJsonSchema = {
  type: 'object',
  properties: {
    answerScore: {
      type: 'integer',
    },
    dimensionScores: {
      type: 'object',
      properties: {
        relevance: { type: 'integer' },
        structure: { type: 'integer' },
        depth: { type: 'integer' },
        impact: { type: 'integer' },
        verbalCommunication: { type: 'integer' },
        professionalism: { type: 'integer' },
        confidenceSignal: { type: 'integer' },
      },
      required: [
        'relevance',
        'structure',
        'depth',
        'impact',
        'verbalCommunication',
        'professionalism',
        'confidenceSignal',
      ],
    },
    strengths: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    improvements: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    betterAnswerExample: {
      type: 'string',
    },
    followUpQuestion: {
      type: ['string', 'null'],
    },
  },
  required: ['answerScore', 'dimensionScores', 'strengths', 'improvements', 'betterAnswerExample'],
} as const;

export function targetContext(target: TargetApplication) {
  return [
    `Role: ${target.role}`,
    `Company: ${target.company ?? 'Not provided'}`,
    `Industry: ${target.industry}`,
    `Level: ${target.level}`,
    `Interview type: ${target.interviewType}`,
    `Language: ${target.language}`,
    `Job description: ${target.jobDescription ?? 'Not provided'}`,
    `Skills: ${target.skillRequirements ?? 'Not provided'}`,
    `Candidate profile: ${target.candidateSummary ?? 'Not provided'}`,
    `Detailed CV reference: ${target.candidateCvText ?? 'Not provided'}`,
  ].join('\n');
}

function languageInstruction(target: TargetApplication) {
  return target.language === 'en'
    ? 'Respond in English.'
    : 'Respond in Indonesian using a professional, supportive tone.';
}

function buildQuestionPrompt(input: QuestionGenerationInput) {
  const previousTurns = input.previousTurns
    .map((turn, index) =>
      [
        `Turn ${index + 1}`,
        `Question: ${turn.questionText}`,
        `Type: ${turn.questionType}`,
        `Answer: ${turn.answerTranscript ?? 'Not answered yet'}`,
      ].join('\n'),
    )
    .join('\n\n');

  const followUpInstruction = input.preferredFollowUpQuestion
    ? `Use this follow-up question if it is relevant and safe: ${input.preferredFollowUpQuestion}`
    : 'Generate the next realistic interview question.';

  return [
    'You are Intervue, a professional mock interview assistant.',
    languageInstruction(input.target),
    'Return valid JSON only.',
    'Ask exactly one concise question that can be answered in 1-3 minutes.',
    'Do not ask discriminatory, overly personal, or irrelevant questions.',
    `This is question ${input.nextTurnIndex} of ${input.plannedQuestionCount}.`,
    followUpInstruction,
    '',
    'Target application context:',
    targetContext(input.target),
    '',
    'Previous turns:',
    previousTurns || 'None.',
  ].join('\n');
}

function buildEvaluationPrompt(input: AnswerEvaluationInput) {
  return [
    'Evaluate the candidate answer for a mock interview.',
    languageInstruction(input.target),
    'Return valid JSON only.',
    'Be specific, actionable, non-judgmental, and concise.',
    'Use score 0-100 for every dimension.',
    'Treat speech and non-verbal ML outputs as supporting signals only, not final truth.',
    '',
    'Target application context:',
    targetContext(input.target),
    '',
    `Question: ${input.turn.questionText}`,
    `Question type: ${input.turn.questionType}`,
    '',
    'Candidate answer transcript:',
    input.answerTranscript,
    '',
    'Speech baseline metrics:',
    JSON.stringify(input.speechMetrics, null, 2),
    '',
    'Non-verbal ML metrics:',
    JSON.stringify(input.nonverbalMetrics, null, 2),
  ].join('\n');
}

function geminiEndpoint() {
  if (!env.GEMINI_API_KEY) {
    throw new GeminiInterviewError(
      'AI_EVALUATION_FAILED',
      'Gemini API key is not configured on the backend.',
    );
  }

  const model = encodeURIComponent(env.GEMINI_MODEL);
  const key = encodeURIComponent(env.GEMINI_API_KEY);
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

function responseText(payload: unknown) {
  const parsed = z
    .object({
      candidates: z
        .array(
          z.object({
            content: z.object({
              parts: z.array(
                z.object({
                  text: z.string(),
                }),
              ),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!parsed.success) {
    throw new GeminiInterviewError('AI_EVALUATION_FAILED', 'Gemini returned an empty response.');
  }

  const text = parsed.data.candidates[0]?.content.parts
    .map((part) => part.text)
    .join('')
    .trim();

  if (!text) {
    throw new GeminiInterviewError('AI_EVALUATION_FAILED', 'Gemini returned empty text.');
  }

  return text;
}

export function parseGeminiJson<T>(text: string, schema: z.ZodType<T>) {
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new GeminiInterviewError(
      'AI_EVALUATION_FAILED',
      'Gemini response did not match the expected JSON schema.',
    );
  }
}

export function classifyGeminiHttpError(status: number, body: string) {
  const lowerBody = body.toLowerCase();
  if (
    status === 429 ||
    lowerBody.includes('resource_exhausted') ||
    lowerBody.includes('quota') ||
    lowerBody.includes('rate limit')
  ) {
    return new GeminiInterviewError(
      'GEMINI_RATE_LIMITED',
      'Gemini free-tier quota is temporarily unavailable. Please try again later.',
    );
  }

  if (status === 503 || lowerBody.includes('unavailable') || lowerBody.includes('high demand')) {
    return new GeminiInterviewError(
      'AI_EVALUATION_FAILED',
      'Gemini model is temporarily unavailable or under high demand. Please try again later or switch to a more stable Gemini model.',
    );
  }

  if (status === 404 || lowerBody.includes('not found')) {
    return new GeminiInterviewError(
      'AI_EVALUATION_FAILED',
      'Configured Gemini model was not found. Check GEMINI_MODEL in the backend environment.',
    );
  }

  if (status === 400 || lowerBody.includes('invalid')) {
    return new GeminiInterviewError(
      'AI_EVALUATION_FAILED',
      'Gemini rejected the request payload. Check the configured model and structured-output support.',
    );
  }

  return new GeminiInterviewError('AI_EVALUATION_FAILED', 'Gemini request failed.');
}

async function generateStructuredContent<T>({
  prompt,
  responseJsonSchema,
  schema,
}: {
  prompt: string;
  responseJsonSchema: unknown;
  schema: z.ZodType<T>;
}) {
  const response = await fetch(geminiEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseJsonSchema,
      },
    }),
  });

  if (!response.ok) {
    throw classifyGeminiHttpError(response.status, await response.text());
  }

  const payload = (await response.json()) as unknown;
  return parseGeminiJson(responseText(payload), schema);
}

export async function generateInterviewQuestion(input: QuestionGenerationInput) {
  return generateStructuredContent({
    prompt: buildQuestionPrompt(input),
    responseJsonSchema: questionResponseJsonSchema,
    schema: interviewQuestionSchema,
  });
}

export async function evaluateInterviewAnswer(input: AnswerEvaluationInput) {
  return generateStructuredContent({
    prompt: buildEvaluationPrompt(input),
    responseJsonSchema: evaluationResponseJsonSchema,
    schema: answerEvaluationSchema,
  });
}

export function speechMetricsFromTurn(turn: InterviewTurn): SpeechMetrics {
  return {
    confidenceSignal: turn.confidenceSignal,
    deliveryQuality: turn.deliveryQuality,
    durationSeconds: turn.durationSeconds,
    fluencyScore: turn.fluencyScore,
    speechPredictionLabel: turn.speechPredictionLabel,
    speechPredictionModelName: turn.speechPredictionModelName,
    speechPredictionModelVersion: turn.speechPredictionModelVersion,
    speechRecognitionRetryCount: turn.speechRecognitionRetryCount,
    speechRecognitionSource: turn.speechRecognitionSource,
  };
}

export function nonverbalMetricsFromTurn(turn: InterviewTurn): NonverbalMetrics {
  return {
    nonverbalError: turn.nonverbalError,
    nonverbalModelName: turn.nonverbalModelName,
    nonverbalModelVersion: turn.nonverbalModelVersion,
    nonverbalScore: turn.nonverbalScore,
    nonverbalSource: turn.nonverbalSource,
  };
}

export function isGeminiInterviewError(error: unknown): error is GeminiInterviewError {
  return error instanceof GeminiInterviewError;
}

export function toQuestionType(value: QuestionType) {
  return value;
}
