import { Router } from 'express';
import type { Request } from 'express';
import {
  Prisma,
  type InterviewSession,
  type InterviewTurn,
  type TargetApplication,
} from '@prisma/client';
import { z } from 'zod';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import {
  evaluateInterviewAnswer,
  generateInterviewQuestion,
  isGeminiInterviewError,
  nonverbalMetricsFromTurn,
  speechMetricsFromTurn,
} from '../services/gemini-interview.js';
import { predictNonverbalSignals } from '../services/nonverbal-prediction.js';
import { predictSpeechSignals } from '../services/speech-prediction.js';
import { fail, ok } from '../utils/api-response.js';

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  targetApplicationId: z.string().trim().min(1, 'Target application is required.'),
  mode: z.enum(['practice', 'full_simulation']),
  plannedQuestionCount: z.coerce.number().int().min(1).max(10),
});

const nonverbalFeaturesSchema = z.object({
  face_detected_ratio: z.number().finite(),
  head_yaw_mean: z.number().finite(),
  head_yaw_std: z.number().finite(),
  head_pitch_mean: z.number().finite(),
  head_pitch_std: z.number().finite(),
  head_roll_mean: z.number().finite(),
  head_roll_std: z.number().finite(),
  mouth_movement_mean: z.number().finite(),
  mouth_movement_std: z.number().finite(),
  shoulder_movement_mean: z.number().finite(),
  shoulder_movement_std: z.number().finite(),
  hand_movement_mean: z.number().finite(),
  hand_movement_std: z.number().finite(),
  frame_count: z.number().finite().nonnegative(),
  analyzed_duration_seconds: z.number().finite().nonnegative(),
});

const transcriptCorrectionSchema = z.object({
  confidence: z.number().finite().min(0).max(1),
  from: z.string().trim().min(1).max(200),
  source: z.enum([
    'company',
    'role',
    'industry',
    'job_description',
    'skills',
    'candidate',
    'generic',
  ]),
  to: z.string().trim().min(1).max(200),
});

const submitAnswerSchema = z.object({
  answerTranscript: z.string().trim().min(1, 'Transcript is required.').max(20_000),
  rawTranscript: z.string().trim().max(20_000).nullable().optional(),
  transcriptCorrections: z.array(transcriptCorrectionSchema).max(100).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(3600),
  speechRecognitionSource: z.enum(['web_speech_api', 'manual']),
  speechRecognitionLanguage: z.string().trim().max(32).nullable().optional(),
  speechRecognitionRetryCount: z.coerce.number().int().min(0).max(20),
  browserUserAgent: z.string().trim().max(1000).nullable().optional(),
  nonverbalFeatures: nonverbalFeaturesSchema.nullable().optional(),
});

type SessionWithDetails = InterviewSession & {
  targetApplication: TargetApplication;
  turns: Array<
    InterviewTurn & {
      evaluation: {
        id: string;
        turnId: string;
        answerScore: number;
        dimensionScores: Prisma.JsonValue;
        speechMetrics: Prisma.JsonValue;
        nonverbalMetrics: Prisma.JsonValue | null;
        strengths: Prisma.JsonValue;
        improvements: Prisma.JsonValue;
        betterAnswerExample: string;
        followUpQuestion: string | null;
        createdAt: Date;
      } | null;
    }
  >;
};

function serializeJsonArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : [];
}

function serializeEvaluation(evaluation: SessionWithDetails['turns'][number]['evaluation']) {
  if (!evaluation) {
    return null;
  }

  return {
    id: evaluation.id,
    turnId: evaluation.turnId,
    answerScore: evaluation.answerScore,
    dimensionScores: evaluation.dimensionScores,
    speechMetrics: evaluation.speechMetrics,
    nonverbalMetrics: evaluation.nonverbalMetrics,
    strengths: serializeJsonArray(evaluation.strengths),
    improvements: serializeJsonArray(evaluation.improvements),
    betterAnswerExample: evaluation.betterAnswerExample,
    followUpQuestion: evaluation.followUpQuestion,
    createdAt: evaluation.createdAt.toISOString(),
  };
}

function serializeSession(session: InterviewSession) {
  return {
    id: session.id,
    targetApplicationId: session.targetApplicationId,
    mode: session.mode,
    status: session.status,
    plannedQuestionCount: session.plannedQuestionCount,
    completedQuestionCount: session.completedQuestionCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeTarget(target: TargetApplication) {
  return {
    id: target.id,
    role: target.role,
    company: target.company,
    industry: target.industry,
    level: target.level,
    jobDescription: target.jobDescription,
    skillRequirements: target.skillRequirements,
    interviewType: target.interviewType,
    language: target.language,
    candidateSummary: target.candidateSummary,
    candidateCvText: target.candidateCvText,
    status: target.status,
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
  };
}

function serializeTurn(turn: SessionWithDetails['turns'][number]) {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    turnIndex: turn.turnIndex,
    questionText: turn.questionText,
    questionType: turn.questionType,
    answerTranscript: turn.answerTranscript,
    rawTranscript: turn.rawTranscript,
    transcriptCorrections: serializeJsonArray(turn.transcriptCorrections ?? []),
    durationSeconds: turn.durationSeconds,
    speechRecognitionSource: turn.speechRecognitionSource,
    speechRecognitionLanguage: turn.speechRecognitionLanguage,
    speechRecognitionRetryCount: turn.speechRecognitionRetryCount,
    browserUserAgent: turn.browserUserAgent,
    deliveryQuality: turn.deliveryQuality,
    fluencyScore: turn.fluencyScore,
    confidenceSignal: turn.confidenceSignal,
    speechPredictionLabel: turn.speechPredictionLabel,
    speechPredictionModelName: turn.speechPredictionModelName,
    speechPredictionModelVersion: turn.speechPredictionModelVersion,
    nonverbalScore: turn.nonverbalScore,
    nonverbalModelName: turn.nonverbalModelName,
    nonverbalModelVersion: turn.nonverbalModelVersion,
    nonverbalFeatures: turn.nonverbalFeatures,
    nonverbalSource: turn.nonverbalSource,
    nonverbalError: turn.nonverbalError,
    evaluation: serializeEvaluation(turn.evaluation),
    createdAt: turn.createdAt.toISOString(),
    updatedAt: turn.updatedAt.toISOString(),
  };
}

function serializeSessionDetail(session: SessionWithDetails) {
  return {
    ...serializeSession(session),
    targetApplication: serializeTarget(session.targetApplication),
    turns: session.turns.map(serializeTurn),
  };
}

async function findSessionDetail(sessionId: string, userId: string) {
  return prisma.interviewSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      targetApplication: true,
      turns: {
        orderBy: {
          turnIndex: 'asc',
        },
        include: {
          evaluation: true,
        },
      },
    },
  });
}

async function requireUser(request: Request) {
  return getRequestUser(request);
}

type ProgressionEvaluation = {
  followUpQuestion: string | null;
};

type ProgressionInput = {
  session: InterviewSession & {
    targetApplication: TargetApplication;
  };
  turn: Pick<InterviewTurn, 'sessionId' | 'turnIndex'>;
  evaluation: ProgressionEvaluation;
  userId: string;
};

async function progressSessionAfterEvaluation({
  session,
  turn,
  evaluation,
  userId,
}: ProgressionInput) {
  const completedQuestionCount = await prisma.interviewTurn.count({
    where: {
      sessionId: turn.sessionId,
      answerTranscript: {
        not: null,
      },
    },
  });

  if (completedQuestionCount >= session.plannedQuestionCount) {
    await prisma.interviewSession.update({
      where: {
        id: turn.sessionId,
      },
      data: {
        completedQuestionCount,
        status: 'completed',
        endedAt: session.endedAt ?? new Date(),
      },
    });

    return findSessionDetail(turn.sessionId, userId);
  }

  const nextTurnIndex = turn.turnIndex + 1;
  const existingNextTurn = await prisma.interviewTurn.findUnique({
    where: {
      sessionId_turnIndex: {
        sessionId: turn.sessionId,
        turnIndex: nextTurnIndex,
      },
    },
  });

  if (existingNextTurn) {
    await prisma.interviewSession.update({
      where: {
        id: turn.sessionId,
      },
      data: {
        completedQuestionCount,
      },
    });

    return findSessionDetail(turn.sessionId, userId);
  }

  let nextQuestion: {
    questionText: string;
    questionType: 'hr' | 'behavioral' | 'technical' | 'case' | 'follow_up';
  } | null = null;

  if (evaluation.followUpQuestion) {
    nextQuestion = {
      questionText: evaluation.followUpQuestion,
      questionType: 'follow_up',
    };
  } else {
    const previousTurns = await prisma.interviewTurn.findMany({
      where: {
        sessionId: turn.sessionId,
      },
      orderBy: {
        turnIndex: 'asc',
      },
    });

    nextQuestion = await generateInterviewQuestion({
      target: session.targetApplication,
      previousTurns,
      nextTurnIndex,
      plannedQuestionCount: session.plannedQuestionCount,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.interviewTurn.upsert({
      where: {
        sessionId_turnIndex: {
          sessionId: turn.sessionId,
          turnIndex: nextTurnIndex,
        },
      },
      update: {},
      create: {
        sessionId: turn.sessionId,
        turnIndex: nextTurnIndex,
        questionText: nextQuestion.questionText,
        questionType: nextQuestion.questionType,
      },
    });

    await tx.interviewSession.update({
      where: {
        id: turn.sessionId,
      },
      data: {
        completedQuestionCount,
      },
    });
  });

  return findSessionDetail(turn.sessionId, userId);
}

sessionsRouter.post('/', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const parsed = createSessionSchema.safeParse(request.body);

    if (!parsed.success) {
      response
        .status(400)
        .json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const target = await prisma.targetApplication.findFirst({
      where: {
        id: parsed.data.targetApplicationId,
        userId: user.id,
        status: 'active',
      },
    });

    if (!target) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        targetApplicationId: target.id,
        mode: parsed.data.mode,
        plannedQuestionCount: parsed.data.plannedQuestionCount,
      },
    });

    response.status(201).json(ok({ session: serializeSession(session) }));
  } catch (error) {
    next(error);
  }
});

sessionsRouter.get('/:sessionId', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const session = await findSessionDetail(request.params.sessionId, user.id);

    if (!session) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
      return;
    }

    response.json(ok({ session: serializeSessionDetail(session) }));
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post('/:sessionId/start', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const session = await prisma.interviewSession.findFirst({
      where: {
        id: request.params.sessionId,
        userId: user.id,
      },
      include: {
        targetApplication: true,
        turns: {
          orderBy: {
            turnIndex: 'asc',
          },
        },
      },
    });

    if (!session) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
      return;
    }

    if (session.status !== 'setup' && session.status !== 'active') {
      response.status(400).json(fail('VALIDATION_ERROR', 'This session cannot be started.'));
      return;
    }

    let generatedFirstQuestion: Awaited<ReturnType<typeof generateInterviewQuestion>> | null = null;
    const hasFirstTurn = session.turns.some((turn) => turn.turnIndex === 1);
    if (!hasFirstTurn) {
      try {
        generatedFirstQuestion = await generateInterviewQuestion({
          target: session.targetApplication,
          previousTurns: [],
          nextTurnIndex: 1,
          plannedQuestionCount: session.plannedQuestionCount,
        });
      } catch (error) {
        if (isGeminiInterviewError(error)) {
          response
            .status(error.code === 'GEMINI_RATE_LIMITED' ? 429 : 502)
            .json(fail(error.code, error.message));
          return;
        }

        throw error;
      }
    }

    const startedSession = await prisma.$transaction(async (tx) => {
      const updatedSession =
        session.status === 'setup'
          ? await tx.interviewSession.update({
              where: {
                id: session.id,
              },
              data: {
                status: 'active',
                startedAt: new Date(),
              },
            })
          : session;

      const existingFirstTurn = await tx.interviewTurn.findUnique({
        where: {
          sessionId_turnIndex: {
            sessionId: session.id,
            turnIndex: 1,
          },
        },
      });

      if (!existingFirstTurn) {
        await tx.interviewTurn.create({
          data: {
            sessionId: session.id,
            turnIndex: 1,
            questionText: generatedFirstQuestion?.questionText ?? '',
            questionType: generatedFirstQuestion?.questionType ?? 'behavioral',
          },
        });
      }

      return tx.interviewSession.findUniqueOrThrow({
        where: {
          id: updatedSession.id,
        },
        include: {
          targetApplication: true,
          turns: {
            orderBy: {
              turnIndex: 'asc',
            },
            include: {
              evaluation: true,
            },
          },
        },
      });
    });

    response.json(ok({ session: serializeSessionDetail(startedSession) }));
  } catch (error) {
    next(error);
  }
});

sessionsRouter.post('/:sessionId/turns/:turnId/answer', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const parsed = submitAnswerSchema.safeParse(request.body);

    if (!parsed.success) {
      response
        .status(400)
        .json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const turn = await prisma.interviewTurn.findFirst({
      where: {
        id: request.params.turnId,
        sessionId: request.params.sessionId,
        session: {
          userId: user.id,
        },
      },
      include: {
        evaluation: true,
        session: {
          include: {
            targetApplication: true,
          },
        },
      },
    });

    if (!turn) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview turn was not found.'));
      return;
    }

    if (turn.evaluation) {
      let session: SessionWithDetails | null = null;

      try {
        session = await progressSessionAfterEvaluation({
          session: turn.session,
          turn,
          evaluation: turn.evaluation,
          userId: user.id,
        });
      } catch (error) {
        if (isGeminiInterviewError(error)) {
          response
            .status(error.code === 'GEMINI_RATE_LIMITED' ? 429 : 502)
            .json(fail(error.code, error.message));
          return;
        }

        throw error;
      }

      if (!session) {
        response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
        return;
      }

      const existingTurn = session.turns.find((item) => item.id === turn.id) ?? turn;
      response.json(
        ok({
          session: serializeSessionDetail(session),
          turn: serializeTurn(existingTurn),
        }),
      );
      return;
    }

    if (turn.session.status !== 'active') {
      response.status(400).json(fail('VALIDATION_ERROR', 'Only active sessions accept answers.'));
      return;
    }

    const prediction = predictSpeechSignals({
      transcript: parsed.data.answerTranscript,
      durationSeconds: parsed.data.durationSeconds,
      retryCount: parsed.data.speechRecognitionRetryCount,
      source: parsed.data.speechRecognitionSource,
    });
    const nonverbalPrediction = parsed.data.nonverbalFeatures
      ? await predictNonverbalSignals(parsed.data.nonverbalFeatures)
      : null;

    const savedTurn = await prisma.interviewTurn.update({
      where: {
        id: turn.id,
      },
      data: {
        answerTranscript: parsed.data.answerTranscript,
        rawTranscript: parsed.data.rawTranscript ?? null,
        transcriptCorrections: parsed.data.transcriptCorrections ?? Prisma.JsonNull,
        durationSeconds: parsed.data.durationSeconds,
        speechRecognitionSource: parsed.data.speechRecognitionSource,
        speechRecognitionLanguage: parsed.data.speechRecognitionLanguage ?? null,
        speechRecognitionRetryCount: parsed.data.speechRecognitionRetryCount,
        browserUserAgent: parsed.data.browserUserAgent ?? null,
        ...prediction,
        nonverbalFeatures: parsed.data.nonverbalFeatures ?? Prisma.JsonNull,
        nonverbalScore: nonverbalPrediction?.nonverbalScore ?? null,
        nonverbalModelName: nonverbalPrediction?.nonverbalModelName ?? null,
        nonverbalModelVersion: nonverbalPrediction?.nonverbalModelVersion ?? null,
        nonverbalSource: nonverbalPrediction?.nonverbalSource ?? null,
        nonverbalError: nonverbalPrediction?.nonverbalError ?? null,
      },
    });

    const existingEvaluation = await prisma.answerEvaluation.findUnique({
      where: {
        turnId: savedTurn.id,
      },
    });

    if (existingEvaluation) {
      let session: SessionWithDetails | null = null;

      try {
        session = await progressSessionAfterEvaluation({
          session: turn.session,
          turn,
          evaluation: existingEvaluation,
          userId: user.id,
        });
      } catch (error) {
        if (isGeminiInterviewError(error)) {
          response
            .status(error.code === 'GEMINI_RATE_LIMITED' ? 429 : 502)
            .json(fail(error.code, error.message));
          return;
        }

        throw error;
      }

      if (!session) {
        response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
        return;
      }

      const existingTurn =
        session.turns.find((item) => item.id === savedTurn.id) ??
        ({
          ...savedTurn,
          evaluation: existingEvaluation,
        } as SessionWithDetails['turns'][number]);
      response.json(
        ok({
          session: serializeSessionDetail(session),
          turn: serializeTurn(existingTurn),
        }),
      );
      return;
    }

    let evaluation: Awaited<ReturnType<typeof evaluateInterviewAnswer>>;
    try {
      evaluation = await evaluateInterviewAnswer({
        target: turn.session.targetApplication,
        turn: savedTurn,
        answerTranscript: parsed.data.answerTranscript,
        speechMetrics: speechMetricsFromTurn(savedTurn),
        nonverbalMetrics: nonverbalMetricsFromTurn(savedTurn),
      });
    } catch (error) {
      if (isGeminiInterviewError(error)) {
        response
          .status(error.code === 'GEMINI_RATE_LIMITED' ? 429 : 502)
          .json(fail(error.code, error.message));
        return;
      }

      throw error;
    }

    await prisma.answerEvaluation.upsert({
      where: {
        turnId: savedTurn.id,
      },
      update: {
        answerScore: evaluation.answerScore,
        dimensionScores: evaluation.dimensionScores,
        speechMetrics: speechMetricsFromTurn(savedTurn),
        nonverbalMetrics: nonverbalMetricsFromTurn(savedTurn),
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        betterAnswerExample: evaluation.betterAnswerExample,
        followUpQuestion: evaluation.followUpQuestion ?? null,
        rawModelOutput: evaluation,
      },
      create: {
        turnId: savedTurn.id,
        answerScore: evaluation.answerScore,
        dimensionScores: evaluation.dimensionScores,
        speechMetrics: speechMetricsFromTurn(savedTurn),
        nonverbalMetrics: nonverbalMetricsFromTurn(savedTurn),
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        betterAnswerExample: evaluation.betterAnswerExample,
        followUpQuestion: evaluation.followUpQuestion ?? null,
        rawModelOutput: evaluation,
      },
    });

    let session: SessionWithDetails | null = null;

    try {
      session = await progressSessionAfterEvaluation({
        session: turn.session,
        turn,
        evaluation: {
          followUpQuestion: evaluation.followUpQuestion ?? null,
        },
        userId: user.id,
      });
    } catch (error) {
      if (isGeminiInterviewError(error)) {
        response
          .status(error.code === 'GEMINI_RATE_LIMITED' ? 429 : 502)
          .json(fail(error.code, error.message));
        return;
      }

      throw error;
    }

    if (!session) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
      return;
    }

    const resultTurn = session.turns.find((item) => item.id === savedTurn.id);

    if (!resultTurn) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview turn was not found.'));
      return;
    }

    response.json(
      ok({
        session: serializeSessionDetail(session),
        turn: serializeTurn(resultTurn),
      }),
    );
  } catch (error) {
    next(error);
  }
});
