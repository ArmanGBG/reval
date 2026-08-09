import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, canViewStudentTasks, canCreateTaskForStudent, getEligibleTaskSubject, isTaskFieldType, isValidTaskPageRange, validateTaskCurriculum } from '@/lib/api-auth';
import { isTaskStatus, legacyTaskStatus, validateTaskLifecycle } from '@/lib/task-status';

function parseTask(task: Record<string, unknown>) {
  if (typeof task.activityTypes === 'string') {
    try { task.activityTypes = JSON.parse(task.activityTypes); } catch { task.activityTypes = null; }
  }
  return task;
}

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
  const tasks = await db.task.findMany({ where, orderBy: { order: 'asc' } });
  return NextResponse.json({ tasks: tasks.map((task) => parseTask({ ...task })) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    if (typeof body.studentId !== 'string' || typeof body.subjectId !== 'string' || typeof body.date !== 'string' || !isTaskFieldType(body.fieldType)) {
      return NextResponse.json({ error: 'studentId، subjectId، fieldType و date معتبر الزامی هستند' }, { status: 400 });
    }
    if (typeof body.order !== 'number') return NextResponse.json({ error: 'order الزامی و باید عدد باشد' }, { status: 400 });
    if (typeof body.detailsCompleted !== 'boolean') return NextResponse.json({ error: 'detailsCompleted الزامی است' }, { status: 400 });
    if (!isValidTaskPageRange(body.pageStart, body.pageEnd)) return NextResponse.json({ error: 'بازه صفحه معتبر نیست' }, { status: 400 });
    const permission = await canCreateTaskForStudent(ctx, body.studentId);
    if (!permission.allowed || !permission.createdBy) return NextResponse.json({ error: 'اجازه ایجاد تسک برای این دانش‌آموز را ندارید' }, { status: 403 });
    const subject = await getEligibleTaskSubject(body.studentId, body.subjectId, body.fieldType);
    if (!subject) return NextResponse.json({ error: 'درس برای پایه، رشته و نوع ارزیابی دانش‌آموز مجاز نیست' }, { status: 400 });
    const curriculum = await validateTaskCurriculum(body);
    if (!curriculum) return NextResponse.json({ error: 'شناسه‌های برنامه درسی با درس انتخابی سازگار نیستند' }, { status: 400 });
    const status = body.status ?? legacyTaskStatus(body.detailsCompleted, body.completed ?? null);
    if (!isTaskStatus(status)) return NextResponse.json({ error: 'status معتبر نیست' }, { status: 400 });
    const lifecycleError = validateTaskLifecycle(status, body.detailsCompleted, body.completed ?? null);
    if (lifecycleError) return NextResponse.json({ error: lifecycleError }, { status: 400 });
    if (status !== 'DRAFT' && (!Array.isArray(body.activityTypes) || body.activityTypes.length === 0 || typeof body.targetTimeMinutes !== 'number' || body.targetTimeMinutes <= 0 || typeof body.targetTestCount !== 'number' || body.targetTestCount < 0)) {
      return NextResponse.json({ error: 'جزئیات تکمیل‌شده نیازمند فعالیت، زمان و تعداد تست معتبر است' }, { status: 400 });
    }
    if (!body.detailsCompleted && body.completed != null) return NextResponse.json({ error: 'تسک ناقص قابل تکمیل یا رد کردن نیست' }, { status: 400 });
    const task = await db.task.create({ data: {
      studentId: body.studentId, subjectId: subject.id, subject: subject.name, subjectColor: subject.color,
      topic: curriculum.topic, fieldType: body.fieldType, activityTypes: Array.isArray(body.activityTypes) ? JSON.stringify(body.activityTypes) : null,
      targetTimeMinutes: typeof body.targetTimeMinutes === 'number' ? body.targetTimeMinutes : null, actualTimeMinutes: typeof body.actualTimeMinutes === 'number' ? body.actualTimeMinutes : null,
      targetTestCount: typeof body.targetTestCount === 'number' ? body.targetTestCount : null, actualTestCount: typeof body.actualTestCount === 'number' ? body.actualTestCount : null,
      status, completed: body.completed === true ? true : body.completed === false ? false : null, detailsCompleted: body.detailsCompleted,
      date: body.date, order: body.order, createdBy: permission.createdBy, createdById: permission.createdBy === 'advisor' ? ctx.userId : null,
      chapterId: typeof body.chapterId === 'string' ? body.chapterId : null, topicId: typeof body.topicId === 'string' ? body.topicId : null,
      topicModeId: typeof body.topicModeId === 'string' ? body.topicModeId : null, pageStart: typeof body.pageStart === 'number' ? body.pageStart : null, pageEnd: typeof body.pageEnd === 'number' ? body.pageEnd : null,
    } });
    return NextResponse.json({ task: parseTask({ ...task }) }, { status: 201 });
  } catch (cause) {
    console.error('POST /api/tasks error:', cause);
    return NextResponse.json({ error: 'خطا در ایجاد وظیفه' }, { status: 500 });
  }
}
