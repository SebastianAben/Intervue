import { Router } from 'express';
import type { Request } from 'express';
import type { TargetApplication as PrismaTargetApplication } from '@prisma/client';
import { z } from 'zod';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import { fail, ok } from '../utils/api-response.js';

export const targetsRouter = Router();

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().max(10_000).nullable().optional(),
);

const targetPayloadSchema = z.object({
  role: z.string().trim().min(1, 'Role is required.').max(180),
  company: optionalTextSchema,
  industry: z.string().trim().min(1, 'Industry is required.').max(180),
  level: z.enum(['intern', 'fresh_graduate', 'junior', 'mid_level']),
  jobDescription: optionalTextSchema,
  skillRequirements: optionalTextSchema,
  interviewType: z.enum(['hr', 'behavioral', 'technical', 'case', 'mixed']),
  language: z.enum(['id', 'en']),
  candidateSummary: optionalTextSchema,
});

const targetPatchSchema = targetPayloadSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required.',
});

const targetStatusQuerySchema = z.object({
  status: z.enum(['active', 'archived']).default('active'),
});

function serializeTarget(target: PrismaTargetApplication) {
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

async function requireUser(request: Request) {
  return getRequestUser(request);
}

targetsRouter.get('/', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const parsed = targetStatusQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      response.status(400).json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const targets = await prisma.targetApplication.findMany({
      where: {
        userId: user.id,
        status: parsed.data.status,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    response.json(ok({ targets: targets.map(serializeTarget) }));
  } catch (error) {
    next(error);
  }
});

targetsRouter.post('/', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const parsed = targetPayloadSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const target = await prisma.targetApplication.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    });

    response.status(201).json(ok({ target: serializeTarget(target) }));
  } catch (error) {
    next(error);
  }
});

targetsRouter.get('/:targetId', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const target = await prisma.targetApplication.findFirst({
      where: {
        id: request.params.targetId,
        userId: user.id,
      },
    });

    if (!target) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    response.json(ok({ target: serializeTarget(target) }));
  } catch (error) {
    next(error);
  }
});

targetsRouter.patch('/:targetId', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const parsed = targetPatchSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const updateResult = await prisma.targetApplication.updateMany({
      where: {
        id: request.params.targetId,
        userId: user.id,
      },
      data: parsed.data,
    });

    if (updateResult.count === 0) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    const target = await prisma.targetApplication.findFirst({
      where: {
        id: request.params.targetId,
        userId: user.id,
      },
    });

    if (!target) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    response.json(ok({ target: serializeTarget(target) }));
  } catch (error) {
    next(error);
  }
});

targetsRouter.delete('/:targetId', async (request, response, next) => {
  try {
    const user = await requireUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const updateResult = await prisma.targetApplication.updateMany({
      where: {
        id: request.params.targetId,
        userId: user.id,
      },
      data: {
        status: 'archived',
      },
    });

    if (updateResult.count === 0) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    const target = await prisma.targetApplication.findFirst({
      where: {
        id: request.params.targetId,
        userId: user.id,
      },
    });

    if (!target) {
      response.status(404).json(fail('TARGET_NOT_FOUND', 'Target application was not found.'));
      return;
    }

    response.json(ok({ target: serializeTarget(target) }));
  } catch (error) {
    next(error);
  }
});
