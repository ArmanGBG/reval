-- CreateTable
CREATE TABLE "TaskTopic" (
    "taskId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "TaskTopic_pkey" PRIMARY KEY ("taskId", "topicId")
);

-- CreateIndex
CREATE INDEX "TaskTopic_topicId_idx" ON "TaskTopic"("topicId");

-- AddForeignKey
ALTER TABLE "TaskTopic" ADD CONSTRAINT "TaskTopic_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTopic" ADD CONSTRAINT "TaskTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill legacy single-topic selections. This is safe to run once as a migration
-- and keeps existing tasks visible through the new multi-topic relation.
INSERT INTO "TaskTopic" ("taskId", "topicId")
SELECT "id", "topicId"
FROM "Task"
WHERE "topicId" IS NOT NULL
ON CONFLICT DO NOTHING;
