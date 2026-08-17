import { describe, expect, it } from 'vitest';
import {
  clearTaskFormDraft,
  readTaskFormDraft,
  taskFormDraftKey,
  type TaskFormDraft,
  writeTaskFormDraft,
} from '@/lib/task-form-draft';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const draft: TaskFormDraft = {
  version: 1,
  step: 3,
  fieldType: 'کنکور',
  selection: {
    subjectId: 'subject-1',
    subjectName: 'زیست',
    curriculumMode: 'BOOK',
    chapterId: 'chapter-1',
  },
  picker: {
    selectedGrade: 'دوازدهم',
    curriculumMode: 'BOOK',
    selectedChapterId: 'chapter-1',
    selectedTopicIds: ['topic-1'],
    selectedTopicModeId: null,
    selectedSubtopicIds: [],
    pageRangeStart: '10',
    pageRangeEnd: '20',
  },
  activities: ['تست آموزشی'],
  minutes: '90',
  tests: '30',
  teacherClassName: '',
  sessionNumber: '',
  bookName: 'زیست جامع',
  testDescription: 'تست ۱ تا ۳۰',
  updatedAt: '2026-08-17T12:00:00.000Z',
};

describe('task form draft persistence', () => {
  it('separates create drafts by student and date', () => {
    const first = taskFormDraftKey({ studentId: 'student-1', selectedDate: '2026-08-17', mode: 'create' });
    const second = taskFormDraftKey({ studentId: 'student-2', selectedDate: '2026-08-17', mode: 'create' });
    const third = taskFormDraftKey({ studentId: 'student-1', selectedDate: '2026-08-18', mode: 'create' });
    expect(new Set([first, second, third]).size).toBe(3);
  });

  it('separates edit drafts by task id', () => {
    const first = taskFormDraftKey({ studentId: 'student-1', selectedDate: '2026-08-17', mode: 'complete-draft', taskId: 'task-1' });
    const second = taskFormDraftKey({ studentId: 'student-1', selectedDate: '2026-08-17', mode: 'complete-draft', taskId: 'task-2' });
    expect(first).not.toBe(second);
  });

  it('writes, restores and clears every form field', () => {
    const storage = memoryStorage();
    const key = 'draft-key';
    writeTaskFormDraft(storage, key, draft);
    expect(readTaskFormDraft(storage, key)).toEqual(draft);
    clearTaskFormDraft(storage, key);
    expect(readTaskFormDraft(storage, key)).toBeNull();
  });

  it('ignores malformed or unsupported snapshots', () => {
    const storage = memoryStorage();
    storage.setItem('bad-json', '{');
    storage.setItem('wrong-version', JSON.stringify({ ...draft, version: 2 }));
    expect(readTaskFormDraft(storage, 'bad-json')).toBeNull();
    expect(readTaskFormDraft(storage, 'wrong-version')).toBeNull();
  });
});
