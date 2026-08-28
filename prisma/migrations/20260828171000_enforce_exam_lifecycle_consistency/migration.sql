UPDATE "ExamAnalysisTask"
SET "status" = 'PENDING'
WHERE "status" NOT IN ('PENDING', 'COMPLETED', 'INCOMPLETE');

UPDATE "ExamAnalysisTask"
SET "completed" = CASE
  WHEN "status" = 'COMPLETED' THEN TRUE
  ELSE NULL
END;

ALTER TABLE "ExamAnalysisTask"
ADD CONSTRAINT "ExamAnalysisTask_lifecycle_consistency_check"
CHECK (
  ("status" = 'PENDING' AND "completed" IS NULL)
  OR ("status" = 'COMPLETED' AND "completed" IS TRUE)
  OR ("status" = 'INCOMPLETE' AND "completed" IS NULL)
);

ALTER TABLE "ExamParticipant"
ADD CONSTRAINT "ExamParticipant_lifecycle_status_check"
CHECK ("lifecycleStatus" IN ('PENDING', 'COMPLETED', 'INCOMPLETE'));
