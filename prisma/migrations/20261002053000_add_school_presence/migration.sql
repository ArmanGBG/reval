-- AlterTable
ALTER TABLE "Task" ADD COLUMN "isSchoolTask" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "schoolPresenceId" TEXT;

-- CreateTable
CREATE TABLE "SchoolPresence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPresence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolPresence_userId_date_key" ON "SchoolPresence"("userId", "date");
CREATE INDEX "SchoolPresence_userId_date_idx" ON "SchoolPresence"("userId", "date");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_schoolPresenceId_fkey" FOREIGN KEY ("schoolPresenceId") REFERENCES "SchoolPresence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolPresence" ADD CONSTRAINT "SchoolPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
