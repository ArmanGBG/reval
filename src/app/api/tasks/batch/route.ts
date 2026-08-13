import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, canCreateTaskForStudent, canModifyTask, getEligibleTaskSubject, isTaskFieldType, isValidTaskPageRange, validateTaskCurriculum } from '@/lib/api-auth';
import { isTaskStatus, legacyTaskStatus, validateTaskLifecycle } from '@/lib/task-status';
import { parseTaskResponse, taskTopicInclude } from '@/lib/task-api';

// POST /api/tasks/batch
// Create multiple tasks at once (for AI plan parser results).
// Body: { tasks: Task[] }
// Each task may include optional chapterId/topicId/topicModeId — when present,
// the text subject/subjectColor/topic fields are auto-populated from DB.
export async function POST(request: NextRequest) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks باید آرایه‌ای غیرخالی باشد' },
        { status: 400 },
      );
    }

    // Validate each task + resolve curriculum text fields + check auth
    const prepared: Array<Record<string, unknown>> = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.studentId || typeof t.studentId !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: studentId الزامی است` },
          { status: 400 },
        );
      }

      // Authorization: can this user create a task for this student?
      const permission = await canCreateTaskForStudent(ctx, t.studentId);
      if (!permission.allowed || !permission.createdBy) {
        return NextResponse.json(
          { error: `tasks[${i}]: اجازه ایجاد تسک برای این دانش‌آموز را ندارید` },
          { status: 403 },
        );
      }
      if (!isTaskFieldType(t.fieldType)) {
        return NextResponse.json(
          { error: `tasks[${i}]: نوع ارزیابی الزامی است` },
          { status: 400 },
        );
      }
      if (!t.date || typeof t.date !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: تاریخ الزامی است` },
          { status: 400 },
        );
      }
      if (typeof t.subjectId !== 'string' || typeof t.order !== 'number' || typeof t.detailsCompleted !== 'boolean') {
        return NextResponse.json(
          { error: `tasks[${i}]: subjectId، order و detailsCompleted الزامی هستند` },
          { status: 400 },
        );
      }
      if (!isValidTaskPageRange(t.pageStart, t.pageEnd)) {
        return NextResponse.json(
          { error: `tasks[${i}]: بازه صفحه معتبر نیست` },
          { status: 400 },
        );
      }
      const status = t.status ?? legacyTaskStatus(t.detailsCompleted, t.completed ?? null);
      if (!isTaskStatus(status)) return NextResponse.json({ error: `tasks[${i}]: status معتبر نیست` }, { status: 400 });
      const lifecycleError = validateTaskLifecycle(status, t.detailsCompleted, t.completed ?? null);
      if (lifecycleError) return NextResponse.json({ error: `tasks[${i}]: ${lifecycleError}` }, { status: 400 });
      if (status !== 'DRAFT' && (!Array.isArray(t.activityTypes) || t.activityTypes.length === 0 || typeof t.targetTimeMinutes !== 'number' || t.targetTimeMinutes <= 0 || typeof t.targetTestCount !== 'number' || t.targetTestCount < 0)) {
        return NextResponse.json(
          { error: `tasks[${i}]: جزئیات تکمیل‌شده ناقص است` },
          { status: 400 },
        );
      }

      if (!t.detailsCompleted && t.completed != null) {
        return NextResponse.json(
          { error: `tasks[${i}]: تسک ناقص قابل تکمیل یا رد کردن نیست` },
          { status: 400 },
        );
      }
      const subject = await getEligibleTaskSubject(t.studentId, t.subjectId, t.fieldType);
      if (!subject) {
        return NextResponse.json(
          { error: `tasks[${i}]: درس برای دانش‌آموز مجاز نیست` },
          { status: 400 },
        );
      }
      const curriculum = await validateTaskCurriculum(t);
      if (!curriculum) return NextResponse.json({ error: `tasks[${i}]: شناسه‌های برنامه درسی ناسازگارند` }, { status: 400 });

      // Derive createdBy/createdById from session (not body) to prevent spoofing.
      const sessionCreatedBy = permission.createdBy;
      const sessionCreatedById =
        permission.createdBy === 'advisor' ? ctx.userId : null;
      prepared.push({
         ...t,
         status,
        subjectId: subject.id,
        subject: subject.name,
        subjectColor: subject.color,
        topic: curriculum.topic,
        topicIds: curriculum.topicIds,
        createdBy: sessionCreatedBy,
        createdById: sessionCreatedById,
      });
    }

    // Create all tasks in a transaction
    const created = await db.$transaction(
      prepared.map((t) =>
        db.task.create({
          data: {
            studentId: t.studentId as string,
            subjectId: t.subjectId as string,
            subject: t.subject as string,
            subjectColor: (t.subjectColor as string) || '#3EB489',
            topic: (t.topic as string | null) ?? null,
            fieldType: t.fieldType as string,
            activityTypes: Array.isArray(t.activityTypes) ? JSON.stringify(t.activityTypes) : null,
            targetTimeMinutes: typeof t.targetTimeMinutes === 'number' ? t.targetTimeMinutes : null,
            actualTimeMinutes:
              typeof t.actualTimeMinutes === 'number'
                ? t.actualTimeMinutes
                : null,
            targetTestCount: typeof t.targetTestCount === 'number' ? t.targetTestCount : null,
            actualTestCount:
              typeof t.actualTestCount === 'number' ? t.actualTestCount : null,
            completed:
              t.completed === true ? true : t.completed === false ? false : null,
            status: t.status as never,
            detailsCompleted: t.detailsCompleted as boolean,
            date: t.date as string,
            order: typeof t.order === 'number' ? t.order : 0,
            createdBy: t.createdBy as string, // derived from session, not body
            createdById: (t.createdById as string) || null, // derived from session
            chapterId: typeof t.chapterId === 'string' ? t.chapterId : null,
            topicId: typeof t.topicId === 'string' ? t.topicId : null,
            topicModeId:
              typeof t.topicModeId === 'string' ? t.topicModeId : null,
            pageStart: typeof t.pageStart === 'number' ? t.pageStart : null,
            pageEnd: typeof t.pageEnd === 'number' ? t.pageEnd : null,
            topics: { create: Array.isArray(t.topicIds) ? t.topicIds.map((topicId) => ({ topicId: topicId as string })) : [] },
          },
          include: taskTopicInclude,
        }),
      ),
    );

    const parsed = created.map((t) => parseTaskResponse({ ...t }));

    return NextResponse.json({ tasks: parsed }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks/batch error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌ای وظایف' },
      { status: 500 },
    );
  }
}

// PATCH /api/tasks/batch
// Reorder multiple tasks at once.
// Body: { tasks: { id: string, order: number }[] }
// Authorization: caller must be able to modify ALL tasks in the batch
// (owner of each, assigned advisor, or super admin).
export async function PATCH(request: NextRequest) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks باید آرایه‌ای غیرخالی باشد' },
        { status: 400 },
      );
    }

    // Validate structure + check ownership for each task
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.id || typeof t.id !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: id الزامی است` },
          { status: 400 },
        );
      }
      if (typeof t.order !== 'number') {
        return NextResponse.json(
          { error: `tasks[${i}]: order باید عدد باشد` },
          { status: 400 },
        );
      }
      // Ownership check for each task
      const canModify = await canModifyTask(ctx, t.id);
      if (!canModify) {
        return NextResponse.json(
          { error: `tasks[${i}]: دسترسی به این تسک مجاز نیست` },
          { status: 403 },
        );
      }
    }

    // Update all tasks in a transaction
    const updated = await db.$transaction(
      tasks.map(
        (t: { id: string; order: number }) =>
          db.task.update({
            where: { id: t.id },
            data: { order: t.order },
          }),
      ),
    );

    const parsed = updated.map((t) => parseTaskResponse({ ...t }));

    return NextResponse.json({ tasks: parsed });
  } catch (error) {
    console.error('PATCH /api/tasks/batch error:', error);
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'یکی از وظایف یافت نشد' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی دسته‌ای وظایف' },
      { status: 500 },
    );
  }
}
