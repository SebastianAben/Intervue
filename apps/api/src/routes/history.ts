import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import { fail, ok } from '../utils/api-response.js';

export const historyRouter = Router();

historyRouter.get('/', async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const targetApplicationId =
      typeof request.query.targetApplicationId === 'string'
        ? request.query.targetApplicationId.trim()
        : null;
    const where: Prisma.InterviewSessionWhereInput = {
      userId: user.id,
      status: {
        in: ['completed', 'abandoned', 'failed'],
      },
      targetApplication: {
        userId: user.id,
      },
    };

    if (targetApplicationId) {
      where.targetApplicationId = targetApplicationId;
    } else if (request.query.targetApplicationId !== undefined) {
      where.id = {
        in: [],
      };
    }

    const sessions = await prisma.interviewSession.findMany({
      where,
      orderBy: [
        {
          endedAt: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      include: {
        report: true,
        targetApplication: true,
      },
    });

    response.json(
      ok({
        sessions: sessions.map((session) => ({
          id: session.id,
          targetApplicationId: session.targetApplicationId,
          targetRole: session.targetApplication.role,
          targetCompany: session.targetApplication.company,
          targetIndustry: session.targetApplication.industry,
          mode: session.mode,
          status: session.status,
          plannedQuestionCount: session.plannedQuestionCount,
          completedQuestionCount: session.completedQuestionCount,
          overallScore: session.overallScore === null ? null : Math.round(session.overallScore),
          hasReport: Boolean(session.report),
          startedAt: session.startedAt?.toISOString() ?? null,
          endedAt: session.endedAt?.toISOString() ?? null,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        })),
      }),
    );
  } catch (error) {
    next(error);
  }
});
