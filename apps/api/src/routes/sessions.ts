import { Router } from 'express';
import type { Request } from 'express';
import type { InterviewSession, InterviewTurn, TargetApplication } from '@prisma/client';
import { z } from 'zod';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import { buildInitialQuestion } from '../services/interview-question.js';
import { predictSpeechSignals } from '../services/speech-prediction.js';
import { fail, ok } from '../utils/api-response.js';

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  targetApplicationId: z.string().trim().min(1, 'Target application is required.'),
  mode: z.enum(['practice', 'full_simulation']),
  plannedQuestionCount: z.coerce.number().int().min(1).max(10),
});

const submitAnswerSchema = z.object({
  answerTranscript: z.string().trim().min(1, 'Transcript is required.').max(20_000),
  durationSeconds: z.coerce.number().int().min(0).max(3600),
  speechRecognitionSource: z.enum(['web_speech_api', 'manual']),
  speechRecognitionLanguage: z.string().trim().max(32).nullable().optional(),
  speechRecognitionRetryCount: z.coerce.number().int().min(0).max(20),
  browserUserAgent: z.string().trim().max(1000).nullable().optional(),
});

type SessionWithDetails = InterviewSession & {
  targetApplication: TargetApplication;
  turns: InterviewTurn[];
};

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
    status: target.status,
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
  };
}

function serializeTurn(turn: InterviewTurn) {
  return {
    id: turn.id,
    sessionId: turn.sessionId,
    turnIndex: turn.turnIndex,
    questionText: turn.questionText,
    questionType: turn.questionType,
    answerTranscript: turn.answerTranscript,
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

async function requireUser(request: Request) {
  return getRequestUser(request);
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
        const question = buildInitialQuestion(session.targetApplication);
        await tx.interviewTurn.create({
          data: {
            sessionId: session.id,
            turnIndex: 1,
            questionText: question.questionText,
            questionType: question.questionType,
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
        session: true,
      },
    });

    if (!turn) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview turn was not found.'));
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

    const result = await prisma.$transaction(async (tx) => {
      const updatedTurn = await tx.interviewTurn.update({
        where: {
          id: turn.id,
        },
        data: {
          answerTranscript: parsed.data.answerTranscript,
          durationSeconds: parsed.data.durationSeconds,
          speechRecognitionSource: parsed.data.speechRecognitionSource,
          speechRecognitionLanguage: parsed.data.speechRecognitionLanguage ?? null,
          speechRecognitionRetryCount: parsed.data.speechRecognitionRetryCount,
          browserUserAgent: parsed.data.browserUserAgent ?? null,
          ...prediction,
        },
      });

      const completedQuestionCount = await tx.interviewTurn.count({
        where: {
          sessionId: turn.sessionId,
          answerTranscript: {
            not: null,
          },
        },
      });

      const session = await tx.interviewSession.update({
        where: {
          id: turn.sessionId,
        },
        data: {
          completedQuestionCount,
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

      return {
        session,
        turn: updatedTurn,
      };
    });

    response.json(
      ok({
        session: serializeSessionDetail(result.session),
        turn: serializeTurn(result.turn),
      }),
    );
  } catch (error) {
    next(error);
  }
});
