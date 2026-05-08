import type { User } from '@prisma/client';
import type { AuthUser } from '@intervue/shared';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';

export const authCookieName = 'intervue_session';
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
};

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    defaultLanguage: user.defaultLanguage,
  };
}

function getJwtSecret() {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication.');
  }

  return env.JWT_SECRET;
}

export function setSessionCookie(response: Response, userId: string) {
  const token = jwt.sign({ sub: userId } satisfies SessionPayload, getJwtSecret(), {
    expiresIn: sessionMaxAgeSeconds,
  });

  response.cookie(authCookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds * 1000,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  });
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function getRequestUser(request: Request) {
  const token = readCookie(request, authCookieName);

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;

    if (!payload.sub) {
      return null;
    }

    return await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
  } catch {
    return null;
  }
}
