import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { getRequestUser } from '../auth/session.js';
import { prisma } from '../db/prisma.js';
import {
  generateSessionReportFromTurns,
  type GeneratedSessionReport,
  ReportGenerationError,
} from '../services/session-report.js';
import { fail, ok } from '../utils/api-response.js';

export const reportsRouter = Router();

function jsonArray(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : [];
}

function serializeEvaluation(
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
  } | null,
) {
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
    strengths: jsonArray(evaluation.strengths),
    improvements: jsonArray(evaluation.improvements),
    betterAnswerExample: evaluation.betterAnswerExample,
    followUpQuestion: evaluation.followUpQuestion,
    createdAt: evaluation.createdAt.toISOString(),
  };
}

function serializeSessionDetail(
  session: NonNullable<Awaited<ReturnType<typeof findReportSession>>>,
) {
  return {
    id: session.id,
    targetApplicationId: session.targetApplicationId,
    mode: session.mode,
    status: session.status,
    plannedQuestionCount: session.plannedQuestionCount,
    completedQuestionCount: session.completedQuestionCount,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    targetApplication: {
      id: session.targetApplication.id,
      role: session.targetApplication.role,
      company: session.targetApplication.company,
      industry: session.targetApplication.industry,
      level: session.targetApplication.level,
      jobDescription: session.targetApplication.jobDescription,
      skillRequirements: session.targetApplication.skillRequirements,
      interviewType: session.targetApplication.interviewType,
      language: session.targetApplication.language,
      candidateSummary: session.targetApplication.candidateSummary,
      status: session.targetApplication.status,
      createdAt: session.targetApplication.createdAt.toISOString(),
      updatedAt: session.targetApplication.updatedAt.toISOString(),
    },
    turns: session.turns.map((turn) => ({
      id: turn.id,
      sessionId: turn.sessionId,
      turnIndex: turn.turnIndex,
      questionText: turn.questionText,
      questionType: turn.questionType,
      answerTranscript: turn.answerTranscript,
      rawTranscript: turn.rawTranscript,
      transcriptCorrections: jsonArray(turn.transcriptCorrections ?? []),
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
    })),
  };
}

function serializeReport(
  report: NonNullable<Awaited<ReturnType<typeof upsertReport>>>,
  turns: GeneratedSessionReport['turns'],
) {
  return {
    id: report.id,
    sessionId: report.sessionId,
    overallScore: report.overallScore,
    dimensionSummary: report.dimensionSummary,
    speechSummary: report.speechSummary,
    strengths: jsonArray(report.strengths),
    improvementPriorities: jsonArray(report.improvementPriorities),
    recommendations: jsonArray(report.recommendations),
    turns,
    createdAt: report.createdAt.toISOString(),
  };
}

async function findReportSession(sessionId: string, userId: string) {
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
      report: true,
    },
  });
}

async function upsertReport(session: NonNullable<Awaited<ReturnType<typeof findReportSession>>>) {
  const reportData = generateSessionReportFromTurns(session.turns);

  const [report] = await prisma.$transaction([
    prisma.sessionReport.upsert({
      where: {
        sessionId: session.id,
      },
      update: {
        dimensionSummary: reportData.dimensionSummary,
        improvementPriorities: reportData.improvementPriorities,
        overallScore: reportData.overallScore,
        recommendations: reportData.recommendations,
        speechSummary: reportData.speechSummary,
        strengths: reportData.strengths,
      },
      create: {
        sessionId: session.id,
        dimensionSummary: reportData.dimensionSummary,
        improvementPriorities: reportData.improvementPriorities,
        overallScore: reportData.overallScore,
        recommendations: reportData.recommendations,
        speechSummary: reportData.speechSummary,
        strengths: reportData.strengths,
      },
    }),
    prisma.interviewSession.update({
      where: {
        id: session.id,
      },
      data: {
        overallScore: reportData.overallScore,
      },
    }),
  ]);

  return {
    ...report,
    turns: reportData.turns,
  };
}

reportsRouter.get('/:sessionId', async (request, response, next) => {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      response.status(401).json(fail('UNAUTHORIZED', 'Please log in to continue.'));
      return;
    }

    const session = await findReportSession(request.params.sessionId, user.id);

    if (!session) {
      response.status(404).json(fail('SESSION_NOT_FOUND', 'Interview session was not found.'));
      return;
    }

    if (session.status !== 'completed') {
      response
        .status(400)
        .json(fail('VALIDATION_ERROR', 'Report is available after the session is completed.'));
      return;
    }

    try {
      const report = await upsertReport(session);
      response.json(
        ok({
          session: serializeSessionDetail(session),
          report: serializeReport(report, report.turns),
        }),
      );
    } catch (error) {
      if (error instanceof ReportGenerationError) {
        response.status(502).json(fail('REPORT_GENERATION_FAILED', error.message));
        return;
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
});
