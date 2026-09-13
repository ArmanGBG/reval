-- Sleep tracking: NIGHT (main sleep, bedtime+wake, one per night) and
-- NAP (start + explicit duration). Duration stored in minutes.
CREATE TYPE "SleepType" AS ENUM ('NIGHT', 'NAP');

CREATE TABLE "SleepRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "SleepType" NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SleepRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SleepRecord_studentId_date_type_key" ON "SleepRecord"("studentId", "date", "type");
CREATE INDEX "SleepRecord_studentId_date_idx" ON "SleepRecord"("studentId", "date");

ALTER TABLE "SleepRecord" ADD CONSTRAINT "SleepRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
