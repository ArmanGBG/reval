import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, canViewStudentTasks, canCreateTaskForStudent, isTaskFieldType, validateTaskCurriculum } from '@/lib/api-auth';
import { isTaskStatus, legacyTaskStatus, validateTaskLifecycle } from '@/lib/task-status';
import { parseTaskResponse, taskTopicInclude } from '@/lib/task-api';
import { classSessionDetailsComplete, isClassActivityTypes } from '@/lib/class-task';

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  const params = new URL(request.url).searchParams;
  const studentId = params.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId الزامی است' }, { status: 400 });
  if (!(await canViewStudentTasks(ctx, studentId))) return NextResponse.json({ error: 'دسترسی به تسک‌های این دانش‌آموز مجاز نیست' }, { status: 403 });
  const where: Record<string, unknown> = { studentId };
  const [date, startDate, endDate] = [params.get('date'), params.get('startDate'), params.get('endDate')];
  if (date) where.date = date;
  else if (startDate || endDate) where.date = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) };
  const tasks = await db.task.findMany({ where, orderBy: { order: 'asc' }, include: taskTopicInclude });
  return NextResponse.json({ tasks: tasks.map((task) => parseTaskResponse({ ...task })) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    if ('advisorNote' in body && ctx.user.role !== 'ADVISOR') {
      return NextResponse.json({ error: 'فقط مشاور می‌تواند برای تسک یادداشت ثبت کند' }, { status: 403 });
    }
    if (body.advisorNote !== undefined && body.advisorNote !== null && typeof body.advisorNote !== 'string') {
      return NextResponse.json({ error: 'یادداشت مشاور باید متن یا null باشد' }, { status: 400 });
    }
    const hasClassVideo = isClassActivityTypes(body.activityTypes);
    if (typeof body.studentId !== 'string' || typeof body.subjectId !== 'string' || typeof body.date !== 'string' || (!isTaskFieldType(body.fieldType) && !(hasClassVideo && body.fieldType == null))) {
      return NextResponse.json({ error: 'studentId، subjectId و date معتبر الزامی هستند و نوع ارزیابی برای غیرکلاس الزامی است' }, { status: 400 });
    }
    if (typeof body.order !== 'number') return NextResponse.json({ error: 'order الزامی و باید عدد باشد' }, { status: 400 });
    if (typeof body.detailsCompleted !== 'boolean') return NextResponse.json({ error: 'detailsCompleted الزامی است' }, { status: 400 });
    if (hasClassVideo && !classSessionDetailsComplete(body.teacherClassName, body.sessionNumber)) {
      return NextResponse.json({ error: 'نام کلاس و شماره جلسه برای کلاس/ویدیو الزامی است' }, { status: 400 });
    }
    if (hasClassVideo && body.curriculumMode != null && !isTaskFieldType(body.fieldType)) {
      return NextResponse.json({ error: 'برای اتصال کلاس به محتوای درسی، نوع ارزیابی الزامی است' }, { status: 400 });
    }
    const permission = await canCreateTaskForStudent(ctx, body.studentId);
    if (!permission.allowed || !permission.createdBy) return NextResponse.json({ error: 'اجازه ایجاد تسک برای این دانش‌آموز را ندارید' }, { status: 403 });
    const status = body.status ?? legacyTaskStatus(body.detailsCompleted, body.completed ?? null);
    if (!isTaskStatus(status)) return NextResponse.json({ error: 'status معتبر نیست' }, { status: 400 });
    const lifecycleError = validateTaskLifecycle(status, body.detailsCompleted, body.completed ?? null, hasClassVideo);
    if (lifecycleError) return NextResponse.json({ error: lifecycleError }, { status: 400 });
    const curriculum = await validateTaskCurriculum({
      ...body,
      studentId: body.studentId,
      subjectId: body.subjectId,
      fieldType: isTaskFieldType(body.fieldType) ? body.fieldType : null,
      allowSubjectOnly: (status === 'DRAFT' && body.detailsCompleted === false) || hasClassVideo,
      allowAllGrades: true,
    });
    if (!curriculum) return NextResponse.json({ error: 'ساختار برنامه درسی، پایه، رشته یا نوع ارزیابی معتبر نیست' }, { status: 400 });
    const invalidClassMetrics = hasClassVideo && (
      (body.targetTimeMinutes != null && (typeof body.targetTimeMinutes !== 'number' || body.targetTimeMinutes < 0))
      || (body.targetTestCount != null && (typeof body.targetTestCount !== 'number' || body.targetTestCount < 0))
    );
    const invalidStandardMetrics = !hasClassVideo && status !== 'DRAFT' && (!Array.isArray(body.activityTypes) || body.activityTypes.length === 0 || typeof body.targetTimeMinutes !== 'number' || body.targetTimeMinutes < 0 || typeof body.targetTestCount !== 'number' || body.targetTestCount < 0);
    if (invalidClassMetrics || invalidStandardMetrics) {
      return NextResponse.json({ error: 'جزئیات تکمیل‌شده نیازمند فعالیت، زمان و تعداد تست معتبر است' }, { status: 400 });
    }
    if (!body.detailsCompleted && body.completed != null && !hasClassVideo) return NextResponse.json({ error: 'تسک ناقص قابل تکمیل یا رد کردن نیست' }, { status: 400 });
    const hasTestDetails = Array.isArray(body.activityTypes) && (body.activityTypes.includes('تست آموزشی') || body.activityTypes.includes('تست سنجشی'));
    const task = await db.task.create({ data: {
      studentId: body.studentId, subjectId: curriculum.subject.id, subject: curriculum.subject.name, subjectColor: curriculum.subject.color,
       topic: curriculum.topic, fieldType: isTaskFieldType(body.fieldType) ? body.fieldType : null, activityTypes: Array.isArray(body.activityTypes) ? JSON.stringify(body.activityTypes) : null,
      targetTimeMinutes: typeof body.targetTimeMinutes === 'number' ? body.targetTimeMinutes : null, actualTimeMinutes: typeof body.actualTimeMinutes === 'number' ? body.actualTimeMinutes : null,
      targetTestCount: typeof body.targetTestCount === 'number' ? body.targetTestCount : null, actualTestCount: typeof body.actualTestCount === 'number' ? body.actualTestCount : null,
      status, completed: body.completed === true ? true : body.completed === false ? false : null, detailsCompleted: body.detailsCompleted,
      date: body.date, order: body.order, createdBy: permission.createdBy, createdById: permission.createdBy === 'advisor' ? ctx.userId : null,
      chapterId: curriculum.chapterId, topicId: curriculum.topicId,
      topicModeId: curriculum.topicModeId, curriculumMode: curriculum.mode,
      pageStart: curriculum.pageStart, pageEnd: curriculum.pageEnd,
      teacherClassName: hasClassVideo && typeof body.teacherClassName === 'string' ? body.teacherClassName.trim() || null : null,
      sessionNumber: hasClassVideo && typeof body.sessionNumber === 'string' ? body.sessionNumber.trim() || null : null,
      bookName: hasTestDetails && typeof body.bookName === 'string' ? body.bookName.trim() || null : null,
      testDescription: hasTestDetails && typeof body.testDescription === 'string' ? body.testDescription.trim() || null : null,
      advisorNote: permission.createdBy === 'advisor' && typeof body.advisorNote === 'string' ? body.advisorNote.trim() || null : null,
      topics: { create: curriculum.topicIds.map((topicId) => ({ topicId })) },
      topicModeSubtopics: { create: curriculum.subtopicIds.map((topicModeSubtopicId) => ({ topicModeSubtopicId })) },
    }, include: taskTopicInclude });

    // Save suggestions for teacher/class name and book name
    const suggestionPromises: Promise<void>[] = [];
    if (hasClassVideo && typeof body.teacherClassName === 'string' && body.teacherClassName.trim() !== '') {
      suggestionPromises.push(
        db.taskDetailSuggestion.upsert({
          where: {
            studentId_subjectId_type_value: {
              studentId: body.studentId,
              subjectId: curriculum.subject.id,
              type: 'teacherClass',
              value: body.teacherClassName.trim(),
            },
          },
          create: {
            studentId: body.studentId,
            subjectId: curriculum.subject.id,
            type: 'teacherClass',
            value: body.teacherClassName.trim(),
          },
          update: {
            createdAt: new Date(),
          },
        }).then(() => {})
      );
    }
    if (hasTestDetails && typeof body.bookName === 'string' && body.bookName.trim() !== '') {
      suggestionPromises.push(
        db.taskDetailSuggestion.upsert({
          where: {
            studentId_subjectId_type_value: {
              studentId: body.studentId,
              subjectId: curriculum.subject.id,
              type: 'book',
              value: body.bookName.trim(),
            },
          },
          create: {
            studentId: body.studentId,
            subjectId: curriculum.subject.id,
            type: 'book',
            value: body.bookName.trim(),
          },
          update: {
            createdAt: new Date(),
          },
        }).then(() => {})
      );
    }
    await Promise.all(suggestionPromises).catch((error) => console.error('Saving task suggestions failed:', error));

    return NextResponse.json({ task: parseTaskResponse({ ...task }) }, { status: 201 });
  } catch (cause) {
    console.error('POST /api/tasks error:', cause);
    return NextResponse.json({ error: 'خطا در ایجاد وظیفه' }, { status: 500 });
  }
}
