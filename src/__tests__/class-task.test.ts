import { describe, expect, it } from 'vitest';
import { buildClassTask, classSessionDetailsComplete, isClassTask, studentCanEditTask, withoutClassActivity } from '@/lib/class-task';

describe('class/video task contract', () => {
  it('recognizes a class as a standalone activity', () => {
    expect(isClassTask({ activityTypes: ['کلاس/ویدیو'] })).toBe(true);
    expect(isClassTask({ activityTypes: ['کلاس/ویدیو', 'مطالعه'] })).toBe(false);
    expect(isClassTask({ activityTypes: null })).toBe(false);
  });

  it('requires both class name and session for creation', () => {
    expect(classSessionDetailsComplete('استاد رضایی', 'جلسه ۱')).toBe(true);
    expect(classSessionDetailsComplete(' استاد رضایی ', ' جلسه ۱ ')).toBe(true);
    expect(classSessionDetailsComplete('', 'جلسه ۱')).toBe(false);
    expect(classSessionDetailsComplete('استاد رضایی', '')).toBe(false);
    expect(classSessionDetailsComplete(null, 'جلسه ۱')).toBe(false);
  });

  it('builds the same actionable subject-only class for every creation surface', () => {
    const task = buildClassTask({
      id: 'temp', studentId: 'student', subjectId: 'biology', subject: 'زیست', subjectColor: '#4CAF50',
      teacherClassName: ' استاد رضایی ', sessionNumber: ' جلسه ۱ ', date: '2026-08-19', order: 0,
      createdBy: 'student', createdById: null,
    });
    expect(task).toMatchObject({
      fieldType: null,
      activityTypes: ['کلاس/ویدیو'],
      status: 'PENDING',
      detailsCompleted: false,
      curriculumMode: null,
      chapterId: null,
      targetTimeMinutes: null,
      targetTestCount: null,
      teacherClassName: 'استاد رضایی',
      sessionNumber: 'جلسه ۱',
    });
  });

  it('keeps class creation independent from curriculum details', () => {
    const task = buildClassTask({
      id: 'weekly-temp', studentId: 'student', subjectId: 'chemistry', subject: 'شیمی', subjectColor: '#4CAF50',
      teacherClassName: 'کلاس آنلاین', sessionNumber: 'جلسه ۲', date: '2026-08-19', order: 1,
      createdBy: 'student', createdById: null,
    });
    expect(task.curriculumMode).toBeNull();
    expect(task.chapterId).toBeNull();
    expect(task.topicId).toBeNull();
    expect(task.topicModeId).toBeNull();
    expect(task.activityTypes).toEqual(['کلاس/ویدیو']);
  });

  it('fully exits class mode before selecting a normal curriculum task', () => {
    expect(withoutClassActivity(['کلاس/ویدیو'])).toEqual([]);
    expect(isClassTask({ activityTypes: withoutClassActivity(['کلاس/ویدیو']) })).toBe(false);
  });

  it('lets students edit own tasks and advisor class drafts only', () => {
    expect(studentCanEditTask({ createdBy: 'student', status: 'DRAFT', activityTypes: ['مطالعه'], detailsCompleted: false })).toBe(true);
    expect(studentCanEditTask({ createdBy: 'student', status: 'PENDING', activityTypes: ['مطالعه'], detailsCompleted: true })).toBe(true);
    expect(studentCanEditTask({ createdBy: 'student', status: 'COMPLETED', activityTypes: ['کلاس/ویدیو'], detailsCompleted: false })).toBe(true);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'PENDING', activityTypes: ['مطالعه'], detailsCompleted: false })).toBe(false);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'COMPLETED', activityTypes: ['مطالعه'], detailsCompleted: true })).toBe(false);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'SKIPPED', activityTypes: ['مطالعه'], detailsCompleted: true })).toBe(false);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'PENDING', activityTypes: ['کلاس/ویدیو'], detailsCompleted: false })).toBe(true);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'PENDING', activityTypes: ['کلاس/ویدیو'], detailsCompleted: true })).toBe(false);
    expect(studentCanEditTask({ createdBy: 'advisor', status: 'DRAFT', activityTypes: ['مطالعه'], detailsCompleted: false })).toBe(false);
  });
});
