-- Add speech recognition metadata for browser/device compatibility analysis.
ALTER TABLE "InterviewTurn" ADD COLUMN "speechRecognitionLanguage" TEXT;
ALTER TABLE "InterviewTurn" ADD COLUMN "speechRecognitionRetryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "InterviewTurn" ADD COLUMN "browserUserAgent" TEXT;
