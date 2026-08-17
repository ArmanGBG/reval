import type { ActivityType, FieldType } from '@/lib/types';
import type { TaskSelection, TaskSubjectPickerDraftState } from '@/components/shared/TaskSubjectPicker';

const DRAFT_PREFIX = 'reval:task-form-draft:v1';

export interface TaskFormDraft {
  version: 1;
  step: 1 | 2 | 3;
  fieldType: FieldType;
  selection: TaskSelection;
  picker: TaskSubjectPickerDraftState;
  activities: ActivityType[];
  minutes: string;
  tests: string;
  teacherClassName: string;
  sessionNumber: string;
  bookName: string;
  testDescription: string;
  updatedAt: string;
}

export function taskFormDraftKey({
  studentId,
  selectedDate,
  mode,
  taskId,
}: {
  studentId: string;
  selectedDate: string;
  mode: 'create' | 'complete-draft';
  taskId?: string;
}): string {
  return [DRAFT_PREFIX, mode, studentId, taskId ?? selectedDate].map(encodeURIComponent).join(':');
}

export function readTaskFormDraft(storage: Pick<Storage, 'getItem'>, key: string): TaskFormDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<TaskFormDraft>;
    if (
      value.version !== 1
      || (value.step !== 1 && value.step !== 2 && value.step !== 3)
      || (value.fieldType !== 'کنکور' && value.fieldType !== 'نهایی')
      || !value.selection
      || !value.picker
      || !Array.isArray(value.activities)
      || typeof value.minutes !== 'string'
      || typeof value.tests !== 'string'
    ) return null;
    return value as TaskFormDraft;
  } catch {
    return null;
  }
}

export function writeTaskFormDraft(storage: Pick<Storage, 'setItem'>, key: string, draft: TaskFormDraft): void {
  try {
    storage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable in private mode or when its quota is full.
  }
}

export function clearTaskFormDraft(storage: Pick<Storage, 'removeItem'>, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Saving the task still succeeds when local draft cleanup is unavailable.
  }
}
