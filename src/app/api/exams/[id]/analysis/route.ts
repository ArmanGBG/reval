import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';
import { completedValueForTaskStatus, isTaskStatus, validateTaskLifecycle } from '@/lib/task-status';

async function accessExam(request: NextRequest, id: string, studentId: unknown) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return { error };
  if (typeof studentId !== 'string' || !(await canViewStudentTasks(ctx, studentId))) {
    return { error: NextResponse.json({ error: 'دسترسی به تحلیل این دانش‌آموز مجاز نیست' }, { status: 403 }) };
  }
  const exam = await db.exam.findFirst({
    where: { id, participants: { some: { studentId } } },
    select: { id: true, date: true },
  });
  if (!exam) return { error: NextResponse.json({ error: 'آزمون یا شرکت‌کننده یافت نشد' }, { status: 404 }) };
  return { ctx, exam };
}

function serialize(task: {
  id: string; examId: string; studentId: string; date: string; status: string;
  completed: boolean | null; actualTimeMinutes: number | null; advisorNote: string | null;
  createdBy: string; createdById: string | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...task, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString() };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const access = await accessExam(request, id, body.studentId);
  if (access.error || !access.ctx || !access.exam) return access.error;
  if (body.advisorNote != null && (access.ctx.user.role !== 'ADVISOR' || typeof body.advisorNote !== 'string')) {
    return NextResponse.json({ error: 'فقط مشاور می‌تواند توضیح تحلیل ثبت کند' }, { status: 403 });
  }
  const existing = await db.examAnalysisTask.findUnique({
    where: { examId_studentId: { examId: id, studentId: body.studentId } },
  });
  if (existing) return NextResponse.json({ error: 'تسک تحلیل این آزمون قبلاً ساخته شده است' }, { status: 409 });
  const task = await db.examAnalysisTask.create({
    data: {
      examId: id,
      studentId: body.studentId,
      date: typeof body.date === 'string' ? body.date : access.exam.date,
      status: 'PENDING',
      completed: null,
      actualTimeMinutes: null,
      advisorNote: access.ctx.user.role === 'ADVISOR' ? body.advisorNote?.trim() || null : null,
      createdBy: access.ctx.user.role === 'ADVISOR' ? 'advisor' : 'student',
      createdById: access.ctx.user.role === 'ADVISOR' ? access.ctx.userId : null,
    },
  });
  return NextResponse.json({ task: serialize(task) }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const access = await accessExam(request, id, body.studentId);
  if (access.error || !access.ctx) return access.error;
  const existing = await db.examAnalysisTask.findUnique({
    where: { examId_studentId: { examId: id, studentId: body.studentId } },
  });
  if (!existing) return NextResponse.json({ error: 'تسک تحلیل یافت نشد' }, { status: 404 });

  const allowed = access.ctx.user.role === 'ADVISOR'
    ? new Set(['studentId', 'advisorNote', 'date'])
    : new Set(['studentId', 'status', 'actualTimeMinutes']);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return NextResponse.json({ error: 'تغییر این بخش از تسک تحلیل مجاز نیست' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (access.ctx.user.role === 'ADVISOR') {
    if ('advisorNote' in body) {
      if (body.advisorNote !== null && typeof body.advisorNote !== 'string') return NextResponse.json({ error: 'توضیح باید متن باشد' }, { status: 400 });
      data.advisorNote = typeof body.advisorNote === 'string' ? body.advisorNote.trim() || null : null;
    }
    if (typeof body.date === 'string') data.date = body.date;
  } else {
    const status = body.status ?? existing.status;
    if (!isTaskStatus(status) || status === 'DRAFT' || status === 'SKIPPED') return NextResponse.json({ error: 'وضعیت تحلیل معتبر نیست' }, { status: 400 });
    const completed = completedValueForTaskStatus(status);
    const lifecycleError = validateTaskLifecycle(status, true, completed);
    if (lifecycleError) return NextResponse.json({ error: lifecycleError }, { status: 400 });
    if (body.actualTimeMinutes !== undefined && (body.actualTimeMinutes !== null && (typeof body.actualTimeMinutes !== 'number' || body.actualTimeMinutes < 0))) {
      return NextResponse.json({ error: 'زمان واقعی معتبر نیست' }, { status: 400 });
    }
    data.status = status;
    data.completed = completed;
    if ('actualTimeMinutes' in body) data.actualTimeMinutes = body.actualTimeMinutes;
  }
  const task = await db.examAnalysisTask.update({ where: { id: existing.id }, data });
  return NextResponse.json({ task: serialize(task) });
}
