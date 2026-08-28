ALTER TABLE "Exam"
ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'COMPREHENSIVE',
ADD COLUMN "description" TEXT,
ADD COLUMN "subjectId" TEXT,
ADD COLUMN "fieldType" TEXT,
ADD COLUMN "chapterId" TEXT,
ADD COLUMN "topicId" TEXT,
ADD COLUMN "topicModeId" TEXT,
ADD COLUMN "curriculumMode" "CurriculumMode",
ADD COLUMN "curriculumLabel" TEXT,
ADD COLUMN "pageStart" INTEGER,
ADD COLUMN "pageEnd" INTEGER;

UPDATE "Exam"
SET "scope" = 'SUBJECT'
WHERE "subject" <> 'آزمون جامع';

CREATE TABLE "ExamTitleSuggestion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamTitleSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamTitleSuggestion_studentId_value_key" ON "ExamTitleSuggestion"("studentId", "value");
CREATE INDEX "ExamTitleSuggestion_studentId_createdAt_idx" ON "ExamTitleSuggestion"("studentId", "createdAt");
