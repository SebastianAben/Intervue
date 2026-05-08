import { Router } from 'express';
import type { Request } from 'express';
import type { InterviewSession } from '@prisma/client';
import { z } from 'zod';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import { fail, ok } from '../utils/api-response.js';

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  targetApplicationId: z.string().trim().min(1, 'Target application is required.'),
  mode: z.enum(['practice', 'full_simulation']),
  plannedQuestionCount: z.coerce.number().int().min(1).max(10),
});

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
