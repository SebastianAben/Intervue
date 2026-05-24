import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '@intervue/shared';
import type { Prisma, User } from '@prisma/client';

process.env.DATABASE_URL ??= 'postgresql://intervue:intervue@127.0.0.1:5432/intervue_test';
process.env.JWT_SECRET ??= 'auth-route-test-secret';
process.env.NODE_ENV = 'test';

const [{ authCookieName }, { prisma }, { authRouter }] = await Promise.all([
  import('../auth/session.js'),
  import('../db/prisma.js'),
  import('./auth.js'),
]);

const now = new Date('2026-05-24T04:00:00.000Z');

function createTestUser(passwordHash: string): User {
  return {
    id: 'user-delete-1',
    name: 'Delete Test User',
    email: 'delete-test@example.com',
    passwordHash,
    status: 'job_seeker',
    defaultLanguage: 'id',
    createdAt: now,
    updatedAt: now,
  };
}

async function requestDeleteAccount({
  body,
  cookie,
}: {
  body?: unknown;
  cookie?: string;
} = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = app.listen(0);
  await once(server, 'listening');

  try {
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/account`, {
      method: 'DELETE',
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      setCookie: response.headers.get('set-cookie'),
      body: (await response.json()) as ApiResponse<{ deleted: true }>,
    };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

async function requestUpdateAccount({
  body,
  cookie,
}: {
  body?: unknown;
  cookie?: string;
} = {}) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = app.listen(0);
  await once(server, 'listening');

  try {
    const port = (server.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return {
      status: response.status,
      body: (await response.json()) as ApiResponse<{ user: User }>,
    };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

function sessionCookie() {
  const token = jwt.sign({ sub: 'user-delete-1' }, process.env.JWT_SECRET ?? '');
  return `${authCookieName}=${token}`;
}

test('PATCH /api/auth/me requires a logged-in user', async () => {
  const response = await requestUpdateAccount({
    body: {
      name: 'Updated User',
      status: 'student',
      defaultLanguage: 'en',
    },
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.error?.code, 'UNAUTHORIZED');
});

test('PATCH /api/auth/me validates editable account fields', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const passwordHash = await bcrypt.hash('correct-password', 4);
  prisma.user.findUnique = (async () => createTestUser(passwordHash)) as unknown as typeof prisma.user.findUnique;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
  });

  const response = await requestUpdateAccount({
    body: {
      name: 'A',
      status: 'student',
      defaultLanguage: 'id',
    },
    cookie: sessionCookie(),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, 'VALIDATION_ERROR');
});

test('PATCH /api/auth/me updates profile settings for the current user', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalUpdate = prisma.user.update;
  const passwordHash = await bcrypt.hash('correct-password', 4);

  prisma.user.findUnique = (async () => createTestUser(passwordHash)) as unknown as typeof prisma.user.findUnique;
  prisma.user.update = (async (args: Prisma.UserUpdateArgs) => {
    assert.deepEqual(args?.where, { id: 'user-delete-1' });
    assert.deepEqual(args?.data, {
      name: 'Updated User',
      status: 'student',
      defaultLanguage: 'en',
    });

    return {
      ...createTestUser(passwordHash),
      name: 'Updated User',
      status: 'student',
      defaultLanguage: 'en',
    };
  }) as unknown as typeof prisma.user.update;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.user.update = originalUpdate;
  });

  const response = await requestUpdateAccount({
    body: {
      name: 'Updated User',
      status: 'student',
      defaultLanguage: 'en',
    },
    cookie: sessionCookie(),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.error, null);
  assert.equal(response.body.data?.user.name, 'Updated User');
  assert.equal(response.body.data?.user.status, 'student');
  assert.equal(response.body.data?.user.defaultLanguage, 'en');
});

test('DELETE /api/auth/account requires a logged-in user', async () => {
  const response = await requestDeleteAccount({ body: { password: 'correct-password' } });

  assert.equal(response.status, 401);
  assert.equal(response.body.error?.code, 'UNAUTHORIZED');
});

test('DELETE /api/auth/account validates password input', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const passwordHash = await bcrypt.hash('correct-password', 4);
  prisma.user.findUnique = (async () => createTestUser(passwordHash)) as unknown as typeof prisma.user.findUnique;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
  });

  const response = await requestDeleteAccount({ body: { password: '' }, cookie: sessionCookie() });

  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, 'VALIDATION_ERROR');
});

test('DELETE /api/auth/account rejects an incorrect password without deleting data', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalTransaction = prisma.$transaction;
  let transactionCallCount = 0;
  const passwordHash = await bcrypt.hash('correct-password', 4);

  prisma.user.findUnique = (async () => createTestUser(passwordHash)) as unknown as typeof prisma.user.findUnique;
  prisma.$transaction = (async () => {
    transactionCallCount += 1;
    throw new Error('Transaction should not run.');
  }) as typeof prisma.$transaction;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
  });

  const response = await requestDeleteAccount({
    body: { password: 'wrong-password' },
    cookie: sessionCookie(),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, 'VALIDATION_ERROR');
  assert.equal(transactionCallCount, 0);
});

test('DELETE /api/auth/account deletes owned data and clears the session cookie', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalTransaction = prisma.$transaction;
  const originalDeleteSessions = prisma.interviewSession.deleteMany;
  const originalDeleteTargets = prisma.targetApplication.deleteMany;
  const originalDeleteUser = prisma.user.delete;
  const deletedSteps: string[] = [];
  const passwordHash = await bcrypt.hash('correct-password', 4);

  prisma.user.findUnique = (async () => createTestUser(passwordHash)) as unknown as typeof prisma.user.findUnique;
  prisma.interviewSession.deleteMany = (async (args) => {
    assert.deepEqual(args?.where, { userId: 'user-delete-1' });
    deletedSteps.push('sessions');
    return { count: 2 };
  }) as typeof prisma.interviewSession.deleteMany;
  prisma.targetApplication.deleteMany = (async (args) => {
    assert.deepEqual(args?.where, { userId: 'user-delete-1' });
    deletedSteps.push('targets');
    return { count: 1 };
  }) as typeof prisma.targetApplication.deleteMany;
  prisma.user.delete = (async (args) => {
    assert.deepEqual(args?.where, { id: 'user-delete-1' });
    deletedSteps.push('user');
    return createTestUser(passwordHash);
  }) as typeof prisma.user.delete;
  prisma.$transaction = (async (callback: (transaction: typeof prisma) => Promise<unknown>) =>
    callback(prisma)) as unknown as typeof prisma.$transaction;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.$transaction = originalTransaction;
    prisma.interviewSession.deleteMany = originalDeleteSessions;
    prisma.targetApplication.deleteMany = originalDeleteTargets;
    prisma.user.delete = originalDeleteUser;
  });

  const response = await requestDeleteAccount({
    body: { password: 'correct-password' },
    cookie: sessionCookie(),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.error, null);
  assert.equal(response.body.data?.deleted, true);
  assert.deepEqual(deletedSteps, ['sessions', 'targets', 'user']);
  assert.match(response.setCookie ?? '', new RegExp(`${authCookieName}=`));
  assert.match(response.setCookie ?? '', /Expires=Thu, 01 Jan 1970/);
});
