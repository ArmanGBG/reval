-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'PENDING', 'COMPLETED', 'SKIPPED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "CurriculumMode" AS ENUM ('BOOK', 'THEMATIC');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '🦊',
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "grade" TEXT,
    "major" TEXT,
    "goal" TEXT,
    "dailyTargetHours" INTEGER NOT NULL DEFAULT 6,
    "instituteId" TEXT,
    "assignedAdvisorId" TEXT,
    "publicCode" TEXT NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "managerId" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectColor" TEXT NOT NULL,
    "topic" TEXT,
    "fieldType" TEXT NOT NULL,
    "activityTypes" TEXT,
    "targetTimeMinutes" INTEGER,
    "actualTimeMinutes" INTEGER,
    "targetTestCount" INTEGER,
    "actualTestCount" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completed" BOOLEAN,
    "detailsCompleted" BOOLEAN NOT NULL DEFAULT true,
    "date" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdById" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "topicModeId" TEXT,
    "curriculumMode" "CurriculumMode",
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTopic" (
    "taskId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "TaskTopic_pkey" PRIMARY KEY ("taskId","topicId")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectColor" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdById" TEXT NOT NULL,
    "instituteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamParticipant" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "ExamParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER,
    "rank" INTEGER,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3EB489',
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeSubject" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isKonkur" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GradeSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "gradeSubjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chapterNo" INTEGER NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topicNo" INTEGER NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMode" (
    "id" TEXT NOT NULL,
    "gradeSubjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "modeNo" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicModeSubtopic" (
    "id" TEXT NOT NULL,
    "topicModeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtopicNo" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicModeSubtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTopicModeSubtopic" (
    "taskId" TEXT NOT NULL,
    "topicModeSubtopicId" TEXT NOT NULL,

    CONSTRAINT "TaskTopicModeSubtopic_pkey" PRIMARY KEY ("taskId","topicModeSubtopicId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicCode_key" ON "User"("publicCode");

-- CreateIndex
CREATE INDEX "OtpChallenge_phone_purpose_createdAt_idx" ON "OtpChallenge"("phone", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectionRequest_studentId_status_idx" ON "ConnectionRequest"("studentId", "status");

-- CreateIndex
CREATE INDEX "ConnectionRequest_advisorId_status_idx" ON "ConnectionRequest"("advisorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequest_studentId_advisorId_key" ON "ConnectionRequest"("studentId", "advisorId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Institute_managerId_key" ON "Institute"("managerId");

-- CreateIndex
CREATE INDEX "TaskTopic_topicId_idx" ON "TaskTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamParticipant_examId_studentId_key" ON "ExamParticipant"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_studentId_key" ON "ExamResult"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_normalizedName_key" ON "Subject"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "GradeSubject_subjectId_grade_major_key" ON "GradeSubject"("subjectId", "grade", "major");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_gradeSubjectId_chapterNo_key" ON "Chapter"("gradeSubjectId", "chapterNo");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_chapterId_topicNo_key" ON "Topic"("chapterId", "topicNo");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMode_gradeSubjectId_modeNo_key" ON "TopicMode"("gradeSubjectId", "modeNo");

-- CreateIndex
CREATE UNIQUE INDEX "TopicModeSubtopic_topicModeId_subtopicNo_key" ON "TopicModeSubtopic"("topicModeId", "subtopicNo");

-- CreateIndex
CREATE INDEX "TaskTopicModeSubtopic_topicModeSubtopicId_idx" ON "TaskTopicModeSubtopic"("topicModeSubtopicId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedAdvisorId_fkey" FOREIGN KEY ("assignedAdvisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequest" ADD CONSTRAINT "ConnectionRequest_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institute" ADD CONSTRAINT "Institute_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_topicModeId_fkey" FOREIGN KEY ("topicModeId") REFERENCES "TopicMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTopic" ADD CONSTRAINT "TaskTopic_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTopic" ADD CONSTRAINT "TaskTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamParticipant" ADD CONSTRAINT "ExamParticipant_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamParticipant" ADD CONSTRAINT "ExamParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeSubject" ADD CONSTRAINT "GradeSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_gradeSubjectId_fkey" FOREIGN KEY ("gradeSubjectId") REFERENCES "GradeSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicMode" ADD CONSTRAINT "TopicMode_gradeSubjectId_fkey" FOREIGN KEY ("gradeSubjectId") REFERENCES "GradeSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicModeSubtopic" ADD CONSTRAINT "TopicModeSubtopic_topicModeId_fkey" FOREIGN KEY ("topicModeId") REFERENCES "TopicMode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTopicModeSubtopic" ADD CONSTRAINT "TaskTopicModeSubtopic_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTopicModeSubtopic" ADD CONSTRAINT "TaskTopicModeSubtopic_topicModeSubtopicId_fkey" FOREIGN KEY ("topicModeSubtopicId") REFERENCES "TopicModeSubtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Curriculum business invariants enforced at the database boundary.
ALTER TABLE "GradeSubject" ADD CONSTRAINT "GradeSubject_active_eligibility_check"
CHECK (NOT "isActive" OR "isKonkur" OR "isFinal");

ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_chapterNo_check"
CHECK ("chapterNo" >= 1);

ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_page_range_check"
CHECK (
  ("pageStart" IS NULL AND "pageEnd" IS NULL)
  OR
  ("pageStart" IS NOT NULL AND "pageEnd" IS NOT NULL AND "pageStart" >= 1 AND "pageEnd" >= "pageStart")
);

ALTER TABLE "Topic" ADD CONSTRAINT "Topic_topicNo_check"
CHECK ("topicNo" >= 1);

ALTER TABLE "Topic" ADD CONSTRAINT "Topic_page_range_check"
CHECK (
  ("pageStart" IS NULL AND "pageEnd" IS NULL)
  OR
  ("pageStart" IS NOT NULL AND "pageEnd" IS NOT NULL AND "pageStart" >= 1 AND "pageEnd" >= "pageStart")
);

ALTER TABLE "TopicMode" ADD CONSTRAINT "TopicMode_modeNo_check"
CHECK ("modeNo" >= 1);

ALTER TABLE "TopicModeSubtopic" ADD CONSTRAINT "TopicModeSubtopic_subtopicNo_check"
CHECK ("subtopicNo" >= 1);

ALTER TABLE "Task" ADD CONSTRAINT "Task_page_range_check"
CHECK (
  ("pageStart" IS NULL AND "pageEnd" IS NULL)
  OR
  ("pageStart" IS NOT NULL AND "pageEnd" IS NOT NULL AND "pageStart" >= 1 AND "pageEnd" >= "pageStart")
);

ALTER TABLE "Task" ADD CONSTRAINT "Task_curriculum_shape_check"
CHECK (
  "curriculumMode" IS NULL
  OR ("curriculumMode" = 'BOOK' AND "topicModeId" IS NULL)
  OR (
    "curriculumMode" = 'THEMATIC'
    AND "chapterId" IS NULL
    AND "topicId" IS NULL
    AND "pageStart" IS NULL
    AND "pageEnd" IS NULL
  )
);
