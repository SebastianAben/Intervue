-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('student', 'fresh_graduate', 'job_seeker', 'other');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('id', 'en');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "JobLevel" AS ENUM ('intern', 'fresh_graduate', 'junior', 'mid_level');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('hr', 'behavioral', 'technical', 'case', 'mixed');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('practice', 'full_simulation');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('setup', 'active', 'completed', 'abandoned', 'failed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('hr', 'behavioral', 'technical', 'case', 'follow_up');

-- CreateEnum
CREATE TYPE "SpeechRecognitionSource" AS ENUM ('web_speech_api', 'manual');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL,
  "defaultLanguage" "Language" NOT NULL DEFAULT 'id',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "company" TEXT,
  "industry" TEXT NOT NULL,
  "level" "JobLevel" NOT NULL,
  "jobDescription" TEXT,
  "skillRequirements" TEXT,
  "interviewType" "InterviewType" NOT NULL,
  "language" "Language" NOT NULL,
  "candidateSummary" TEXT,
  "status" "TargetStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TargetApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetApplicationId" TEXT NOT NULL,
  "mode" "SessionMode" NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'setup',
  "plannedQuestionCount" INTEGER NOT NULL,
  "completedQuestionCount" INTEGER NOT NULL DEFAULT 0,
  "overallScore" DOUBLE PRECISION,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewTurn" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "turnIndex" INTEGER NOT NULL,
  "questionText" TEXT NOT NULL,
  "questionType" "QuestionType" NOT NULL,
  "answerTranscript" TEXT,
  "durationSeconds" INTEGER,
  "speechRecognitionSource" "SpeechRecognitionSource",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InterviewTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerEvaluation" (
  "id" TEXT NOT NULL,
  "turnId" TEXT NOT NULL,
  "answerScore" INTEGER NOT NULL,
  "dimensionScores" JSONB NOT NULL,
  "speechMetrics" JSONB NOT NULL,
  "strengths" JSONB NOT NULL,
  "improvements" JSONB NOT NULL,
  "betterAnswerExample" TEXT NOT NULL,
  "followUpQuestion" TEXT,
  "rawModelOutput" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnswerEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionReport" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "overallScore" INTEGER NOT NULL,
  "dimensionSummary" JSONB NOT NULL,
  "speechSummary" JSONB NOT NULL,
  "strengths" JSONB NOT NULL,
  "improvementPriorities" JSONB NOT NULL,
  "recommendations" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TargetApplication_userId_status_idx" ON "TargetApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_status_idx" ON "InterviewSession"("userId", "status");

-- CreateIndex
CREATE INDEX "InterviewSession_targetApplicationId_idx" ON "InterviewSession"("targetApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewTurn_sessionId_turnIndex_key" ON "InterviewTurn"("sessionId", "turnIndex");

-- CreateIndex
CREATE INDEX "InterviewTurn_sessionId_idx" ON "InterviewTurn"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerEvaluation_turnId_key" ON "AnswerEvaluation"("turnId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionReport_sessionId_key" ON "SessionReport"("sessionId");

-- AddForeignKey
ALTER TABLE "TargetApplication" ADD CONSTRAINT "TargetApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_targetApplicationId_fkey" FOREIGN KEY ("targetApplicationId") REFERENCES "TargetApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewTurn" ADD CONSTRAINT "InterviewTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvaluation" ADD CONSTRAINT "AnswerEvaluation_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "InterviewTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
