ALTER TABLE "ExamAnalysisTask" DROP CONSTRAINT IF EXISTS "ExamAnalysisTask_lifecycle_consistency_check";
ALTER TABLE "ExamParticipant" DROP CONSTRAINT IF EXISTS "ExamParticipant_lifecycle_status_check";

ALTER TABLE "Task" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "SleepRecord" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
ALTER TABLE "Exam" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ExamAnalysisTask" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ExamParticipant" ALTER COLUMN "lifecycleStatus" TYPE TEXT USING "lifecycleStatus"::text;
ALTER TABLE "ConnectionRequest" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ConnectionRequest" ALTER COLUMN "initiatedBy" TYPE TEXT USING "initiatedBy"::text;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;

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
