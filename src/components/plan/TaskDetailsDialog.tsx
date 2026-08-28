'use client';

import type { Task } from '@/lib/types';
import type { UpdateTaskPayload } from '@/lib/task-service';
import { buildTaskDetailsUpdate } from '@/lib/task-service';
import ManualEntrySheet from './ManualEntrySheet';

export function TaskDetailsDialog({ task, open, onOpenChange, grade, major, onSave, canEditAdvisorNote = false }: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  major: string;
  onSave: (updates: UpdateTaskPayload) => Promise<void> | void;
  canEditAdvisorNote?: boolean;
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
      canEditAdvisorNote={canEditAdvisorNote}
      mode={task.status === 'DRAFT' ? 'complete-draft' : 'edit'}
      initialTask={task}
      onSubmit={async (nextTask) => {
        const updates = buildTaskDetailsUpdate(task, nextTask);
        if (!canEditAdvisorNote) delete updates.advisorNote;
        await onSave(updates);
      }}
    />
  );
}
