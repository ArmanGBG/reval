ALTER TABLE "Task" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "SleepRecord" ALTER COLUMN "type" TYPE TEXT USING "type"::text;
ALTER TABLE "Exam" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ExamAnalysisTask" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ExamParticipant" ALTER COLUMN "lifecycleStatus" TYPE TEXT USING "lifecycleStatus"::text;
ALTER TABLE "ConnectionRequest" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "ConnectionRequest" ALTER COLUMN "initiatedBy" TYPE TEXT USING "initiatedBy"::text;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
