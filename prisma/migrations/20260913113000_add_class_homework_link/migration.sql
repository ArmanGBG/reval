-- Class homework self-relation: an educational-test task linked as the
-- homework of a class/video task. One homework per class (unique).
ALTER TABLE "Task" ADD COLUMN "classHomeworkOfId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Task_classHomeworkOfId_key" ON "Task"("classHomeworkOfId");

-- AddForeignKey with ON DELETE CASCADE: deleting the class removes its homework
ALTER TABLE "Task" ADD CONSTRAINT "Task_classHomeworkOfId_fkey" FOREIGN KEY ("classHomeworkOfId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
