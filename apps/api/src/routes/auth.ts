import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { fail, ok } from '../utils/api-response.js';
import {
  clearSessionCookie,
  getRequestUser,
  setSessionCookie,
  toAuthUser,
} from '../auth/session.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(120),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  status: z.enum(['student', 'fresh_graduate', 'job_seeker', 'other']),
  defaultLanguage: z.enum(['id', 'en']).default('id'),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});

authRouter.get('/me', async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    response.json(ok({ user: toAuthUser(user) }));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/register', async (request, response, next) => {
  try {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (existingUser) {
      response.status(409).json(fail('VALIDATION_ERROR', 'Email is already registered.'));
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        status: parsed.data.status,
        defaultLanguage: parsed.data.defaultLanguage,
      },
    });

    setSessionCookie(response, user.id);
    response.status(201).json(ok({ user: toAuthUser(user) }));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json(fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.'));
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
    });

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Email or password is incorrect.'));
      return;
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

    if (!passwordMatches) {
      response.status(401).json(fail('UNAUTHORIZED', 'Email or password is incorrect.'));
      return;
    }

    setSessionCookie(response, user.id);
    response.json(ok({ user: toAuthUser(user) }));
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_request, response) => {
  clearSessionCookie(response);
  response.json(ok({ loggedOut: true }));
});
