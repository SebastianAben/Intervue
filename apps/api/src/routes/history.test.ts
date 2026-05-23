import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import express from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse, HistorySessionSummary } from '@intervue/shared';
import type { Prisma, User } from '@prisma/client';

process.env.DATABASE_URL ??= 'postgresql://intervue:intervue@127.0.0.1:5432/intervue_test';
process.env.JWT_SECRET ??= 'history-route-test-secret';
process.env.NODE_ENV = 'test';

const [{ authCookieName }, { prisma }, { historyRouter }] = await Promise.all([
  import('../auth/session.js'),
  import('../db/prisma.js'),
  import('./history.js'),
]);

const now = new Date('2026-05-23T04:00:00.000Z');

function createTestUser(id = 'user-1'): User {
  return {
    id,
    name: 'Test User',
    email: `${id}@example.com`,
    passwordHash: 'hash',
    status: 'job_seeker',
    defaultLanguage: 'id',
    createdAt: now,
    updatedAt: now,
  };
}

function createSession(targetApplicationId: string) {
  return {
    id: `session-${targetApplicationId}`,
    targetApplicationId,
    targetApplication: {
      id: targetApplicationId,
      userId: 'user-1',
      role: targetApplicationId === 'target-1' ? 'Backend Engineer' : 'Data Analyst',
      company: targetApplicationId === 'target-1' ? 'Intervue' : null,
      industry: 'Technology',
      level: 'junior',
      jobDescription: null,
      skillRequirements: null,
      interviewType: 'technical',
      language: 'id',
      candidateSummary: null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    userId: 'user-1',
    mode: 'practice',
    status: 'completed',
    plannedQuestionCount: 3,
    completedQuestionCount: 3,
    overallScore: 81.6,
    report: {
      id: `report-${targetApplicationId}`,
    },
    startedAt: now,
    endedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function mockUserFindUnique(user = createTestUser()) {
  return (async () => user) as unknown as typeof prisma.user.findUnique;
}

function requireWhere(args: Prisma.InterviewSessionFindManyArgs | undefined) {
  assert.ok(args?.where);
  return args.where;
}

async function requestHistory(path: string) {
  const app = express();
  app.use('/api/history', historyRouter);

  const server = app.listen(0);
  await once(server, 'listening');

  try {
    const port = (server.address() as AddressInfo).port;
    const token = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET ?? '');
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        cookie: `${authCookieName}=${token}`,
      },
    });

    return {
      status: response.status,
      body: (await response.json()) as ApiResponse<{ sessions: HistorySessionSummary[] }>,
    };
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('GET /api/history filters completed sessions by targetApplicationId', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalFindMany = prisma.interviewSession.findMany;
  let findManyCallCount = 0;

  prisma.user.findUnique = mockUserFindUnique();
  prisma.interviewSession.findMany = (async (args) => {
    findManyCallCount += 1;
    const where = requireWhere(args);
    assert.equal(where.userId, 'user-1');
    assert.deepEqual(where.status, {
      in: ['completed', 'abandoned', 'failed'],
    });
    assert.deepEqual(where.targetApplication, {
      userId: 'user-1',
    });
    assert.equal(where.targetApplicationId, 'target-1');

    return [createSession('target-1')];
  }) as typeof prisma.interviewSession.findMany;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.interviewSession.findMany = originalFindMany;
  });

  const response = await requestHistory('/api/history?targetApplicationId=target-1');

  assert.equal(response.status, 200);
  assert.equal(response.body.error, null);
  assert.equal(response.body.data?.sessions.length, 1);
  assert.equal(response.body.data?.sessions[0]?.targetApplicationId, 'target-1');
  assert.equal(response.body.data?.sessions[0]?.targetRole, 'Backend Engineer');
  assert.equal(response.body.data?.sessions[0]?.overallScore, 82);
  assert.equal(findManyCallCount, 1);
});

test('GET /api/history returns an empty list for foreign or unknown target IDs', async (t) => {
  const originalFindUnique = prisma.user.findUnique;
  const originalFindMany = prisma.interviewSession.findMany;

  prisma.user.findUnique = mockUserFindUnique();
  prisma.interviewSession.findMany = (async (args) => {
    const where = requireWhere(args);
    assert.equal(where.userId, 'user-1');
    assert.deepEqual(where.targetApplication, {
      userId: 'user-1',
    });
    assert.equal(where.targetApplicationId, 'foreign-target');

    return [];
  }) as typeof prisma.interviewSession.findMany;
  t.after(() => {
    prisma.user.findUnique = originalFindUnique;
    prisma.interviewSession.findMany = originalFindMany;
  });

  const response = await requestHistory('/api/history?targetApplicationId=foreign-target');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.data, {
    sessions: [],
  });
  assert.equal(response.body.error, null);
});
