DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Task"
    WHERE "detailsCompleted" = false
      AND "completed" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Task status migration blocked: contradictory legacy tasks exist';
  END IF;
END $$;

CREATE TYPE "TaskStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'COMPLETED',
  'SKIPPED',
  'INCOMPLETE'
);

ALTER TABLE "Task"
ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Task"
SET "status" = CASE
  WHEN "detailsCompleted" = false THEN 'DRAFT'::"TaskStatus"
  WHEN "completed" = true THEN 'COMPLETED'::"TaskStatus"
  WHEN "completed" = false THEN 'SKIPPED'::"TaskStatus"
  ELSE 'PENDING'::"TaskStatus"
END;
