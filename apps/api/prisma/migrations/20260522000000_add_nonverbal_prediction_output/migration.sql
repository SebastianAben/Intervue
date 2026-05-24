ALTER TABLE "InterviewTurn"
ADD COLUMN "nonverbalScore" DOUBLE PRECISION,
ADD COLUMN "nonverbalModelName" TEXT,
ADD COLUMN "nonverbalModelVersion" TEXT,
ADD COLUMN "nonverbalFeatures" JSONB,
ADD COLUMN "nonverbalSource" TEXT,
ADD COLUMN "nonverbalError" TEXT;

ALTER TABLE "AnswerEvaluation"
ADD COLUMN "nonverbalMetrics" JSONB;
