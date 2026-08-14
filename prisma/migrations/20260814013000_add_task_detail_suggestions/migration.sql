ALTER TABLE "Task"
ADD COLUMN "teacherClassName" TEXT,
ADD COLUMN "sessionNumber" TEXT,
ADD COLUMN "bookName" TEXT,
ADD COLUMN "testDescription" TEXT;

CREATE TABLE "TaskDetailSuggestion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDetailSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskDetailSuggestion_studentId_subjectId_type_value_key"
ON "TaskDetailSuggestion"("studentId", "subjectId", "type", "value");

CREATE INDEX "TaskDetailSuggestion_studentId_subjectId_type_idx"
ON "TaskDetailSuggestion"("studentId", "subjectId", "type");
