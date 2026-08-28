CREATE TABLE "ExamAnalysisTask" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completed" BOOLEAN,
    "actualTimeMinutes" INTEGER,
    "advisorNote" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAnalysisTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExamSubjectAnalysis" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "analyzed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSubjectAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamAnalysisTask_examId_studentId_key" ON "ExamAnalysisTask"("examId", "studentId");
CREATE INDEX "ExamAnalysisTask_studentId_date_idx" ON "ExamAnalysisTask"("studentId", "date");
CREATE UNIQUE INDEX "ExamSubjectAnalysis_examId_studentId_subjectName_key" ON "ExamSubjectAnalysis"("examId", "studentId", "subjectName");
CREATE INDEX "ExamSubjectAnalysis_studentId_updatedAt_idx" ON "ExamSubjectAnalysis"("studentId", "updatedAt");

ALTER TABLE "ExamAnalysisTask" ADD CONSTRAINT "ExamAnalysisTask_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAnalysisTask" ADD CONSTRAINT "ExamAnalysisTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAnalysisTask" ADD CONSTRAINT "ExamAnalysisTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExamSubjectAnalysis" ADD CONSTRAINT "ExamSubjectAnalysis_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamSubjectAnalysis" ADD CONSTRAINT "ExamSubjectAnalysis_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
