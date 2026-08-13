import { describe, expect, it } from 'vitest';
import {
  canMoveTaskToDate,
  isStudentAdvisorTaskPatch,
  moveTaskToDateTransition,
  moveTaskToIncompleteTransition,
  validateTaskLifecycle,
} from '@/lib/task-status';
import { taskPatchData } from '@/lib/task-api';

describe('task lifecycle transitions', () => {
  it('moves an active task to another date as pending', () => {
    expect(moveTaskToDateTransition('2026-08-13')).toEqual({
      date: '2026-08-13',
      status: 'PENDING',
      completed: null,
    });
  });

  it('moves a task to incomplete without changing date or details', () => {
    expect(moveTaskToIncompleteTransition()).toEqual({ status: 'INCOMPLETE', completed: null });
  });

  it('does not allow drafts or finalized tasks to move dates implicitly', () => {
    expect(canMoveTaskToDate('PENDING')).toBe(true);
    expect(canMoveTaskToDate('INCOMPLETE')).toBe(true);
    expect(canMoveTaskToDate('DRAFT')).toBe(false);
    expect(canMoveTaskToDate('COMPLETED')).toBe(false);
    expect(canMoveTaskToDate('SKIPPED')).toBe(false);
  });

  it('requires complete details for incomplete lifecycle', () => {
    expect(validateTaskLifecycle('INCOMPLETE', true, null)).toBeNull();
    expect(validateTaskLifecycle('INCOMPLETE', false, null)).not.toBeNull();
  });
});

describe('advisor-created task student permissions', () => {
  it('allows lifecycle and actual metric fields', () => {
    expect(isStudentAdvisorTaskPatch({ status: 'INCOMPLETE', completed: null })).toBe(true);
    expect(isStudentAdvisorTaskPatch({ actualTimeMinutes: 45, actualTestCount: 20 })).toBe(true);
  });

  it('rejects date, target and content changes', () => {
    expect(isStudentAdvisorTaskPatch({ date: '2026-08-13' })).toBe(false);
    expect(isStudentAdvisorTaskPatch({ targetTimeMinutes: 60 })).toBe(false);
    expect(isStudentAdvisorTaskPatch({ chapterId: 'chapter-1' })).toBe(false);
    expect(isStudentAdvisorTaskPatch({})).toBe(false);
  });
});

describe('task topic relation patches', () => {
  it('never treats topicIds as a direct Task column', () => {
    expect(taskPatchData(
      { status: 'PENDING', topicIds: ['topic-1'], detailsCompleted: true },
      ['status', 'topicIds', 'detailsCompleted'],
    )).toEqual({ status: 'PENDING', detailsCompleted: true });
  });
});
