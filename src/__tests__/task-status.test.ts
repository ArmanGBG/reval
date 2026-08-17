import { describe, expect, it } from 'vitest';
import {
  canMoveTaskToDate,
  isTaskVisibleOnScheduledDay,
  isAdvisorMoveTaskPatch,
  isAdvisorPlanTaskPatch,
  isStudentAdvisorTaskPatch,
  moveTaskToDateTransition,
  moveTaskToIncompleteTransition,
  validateTaskLifecycle,
} from '@/lib/task-status';
import { taskPatchData } from '@/lib/task-api';
import { buildTaskDetailsUpdate } from '@/lib/task-service';
import type { Task } from '@/lib/types';

const completedTask: Task = {
  id: 'task-1',
  studentId: 'student-1',
  subjectId: 'subject-1',
  subject: 'زیست',
  subjectColor: '#00aa77',
  topic: 'فصل اول',
  fieldType: 'کنکور',
  activityTypes: ['مطالعه'],
  targetTimeMinutes: 60,
  actualTimeMinutes: 55,
  targetTestCount: 20,
  actualTestCount: 18,
  status: 'COMPLETED',
  completed: true,
  detailsCompleted: true,
  date: '2026-08-17',
  order: 0,
  createdBy: 'student',
};

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

  it('shows dated drafts in the daily plan but excludes incompletes', () => {
    expect(isTaskVisibleOnScheduledDay('DRAFT', false)).toBe(true);
    expect(isTaskVisibleOnScheduledDay('PENDING', true)).toBe(true);
    expect(isTaskVisibleOnScheduledDay('INCOMPLETE', true)).toBe(false);
  });

  it('allows advisors to edit plan fields without writing student execution', () => {
    expect(isAdvisorPlanTaskPatch({
      subjectId: 'subject-1',
      chapterId: 'chapter-1',
      topicIds: ['topic-1'],
      activityTypes: ['مطالعه'],
      targetTimeMinutes: 90,
      targetTestCount: 0,
      detailsCompleted: true,
      status: 'PENDING',
      completed: null,
      actualTimeMinutes: null,
      actualTestCount: null,
    })).toBe(true);
    expect(isAdvisorPlanTaskPatch({ status: 'COMPLETED', completed: true, actualTimeMinutes: 90 })).toBe(false);
    expect(isAdvisorPlanTaskPatch({ actualTestCount: 20 })).toBe(false);
  });

  it('rejects display-derived fields that the API resolves from curriculum', () => {
    expect(isAdvisorPlanTaskPatch({ subject: 'زیست', targetTimeMinutes: 90 })).toBe(false);
    expect(isAdvisorPlanTaskPatch({ subjectColor: '#fff', targetTimeMinutes: 90 })).toBe(false);
    expect(isAdvisorPlanTaskPatch({ topic: 'فصل اول', targetTimeMinutes: 90 })).toBe(false);
  });

  it('allows plan-only edits without lifecycle fields for finalized tasks', () => {
    expect(isAdvisorPlanTaskPatch({
      subjectId: 'subject-1',
      activityTypes: ['مرور'],
      targetTimeMinutes: 60,
      targetTestCount: 0,
      bookName: 'کتاب جدید',
    })).toBe(true);
  });

  it('recognizes only the exact advisor move transition', () => {
    expect(isAdvisorMoveTaskPatch({ date: '2026-08-20', status: 'PENDING', completed: null })).toBe(true);
    expect(isAdvisorMoveTaskPatch({ date: '2026-08-20', status: 'INCOMPLETE', completed: null })).toBe(false);
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

describe('task details update payload', () => {
  it('removes display fields and preserves finalized execution results', () => {
    const updates = buildTaskDetailsUpdate(completedTask, {
      ...completedTask,
      subject: 'شیمی',
      subjectColor: '#ffffff',
      topic: 'فصل دوم',
      activityTypes: ['مرور'],
      targetTimeMinutes: 75,
      status: 'PENDING',
      completed: null,
      actualTimeMinutes: null,
      actualTestCount: null,
    });

    expect(updates).not.toHaveProperty('subject');
    expect(updates).not.toHaveProperty('subjectColor');
    expect(updates).not.toHaveProperty('topic');
    expect(updates).not.toHaveProperty('status');
    expect(updates).not.toHaveProperty('completed');
    expect(updates).not.toHaveProperty('actualTimeMinutes');
    expect(updates).not.toHaveProperty('actualTestCount');
    expect(updates.targetTimeMinutes).toBe(75);
    expect(updates.activityTypes).toEqual(['مرور']);
    expect(isAdvisorPlanTaskPatch(updates as Record<string, unknown>)).toBe(true);
  });
});
