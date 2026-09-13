-- CreateTable
CREATE TABLE "NonStudyActivity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonStudyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NonStudyActivity_studentId_date_idx" ON "NonStudyActivity"("studentId", "date");

-- AddForeignKey
ALTER TABLE "NonStudyActivity" ADD CONSTRAINT "NonStudyActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
