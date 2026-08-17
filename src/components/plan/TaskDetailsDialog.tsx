'use client';

import type { Task } from '@/lib/types';
import type { UpdateTaskPayload } from '@/lib/task-service';
import { buildTaskDetailsUpdate } from '@/lib/task-service';
import ManualEntrySheet from './ManualEntrySheet';

export function TaskDetailsDialog({ task, open, onOpenChange, grade, major, onSave }: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  major: string;
  onSave: (updates: UpdateTaskPayload) => Promise<void> | void;
}) {
  if (!task) return null;
  return (
    <ManualEntrySheet
      open={open}
      onOpenChange={onOpenChange}
      selectedDate={task.date}
      existingTaskCount={task.order}
      studentId={task.studentId}
      grade={grade}
      major={major}
      createdBy={task.createdBy}
      createdById={task.createdById ?? null}
      mode="complete-draft"
      initialTask={task}
      onSubmit={async (nextTask) => {
        await onSave(buildTaskDetailsUpdate(task, nextTask));
      }}
    />
  );
}
