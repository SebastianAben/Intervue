-- Persist local speech analytics prediction outputs for reporting and auditability.
ALTER TABLE "InterviewTurn" ADD COLUMN "deliveryQuality" DOUBLE PRECISION;
ALTER TABLE "InterviewTurn" ADD COLUMN "fluencyScore" DOUBLE PRECISION;
ALTER TABLE "InterviewTurn" ADD COLUMN "confidenceSignal" DOUBLE PRECISION;
ALTER TABLE "InterviewTurn" ADD COLUMN "speechPredictionLabel" TEXT;
ALTER TABLE "InterviewTurn" ADD COLUMN "speechPredictionModelName" TEXT;
ALTER TABLE "InterviewTurn" ADD COLUMN "speechPredictionModelVersion" TEXT;
