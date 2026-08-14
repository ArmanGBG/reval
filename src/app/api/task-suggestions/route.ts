import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, canViewStudentTasks } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const params = new URL(request.url).searchParams;
  const studentId = params.get('studentId');
  const subjectId = params.get('subjectId');
  const type = params.get('type');

  if (!studentId || !subjectId || !type) {
    return NextResponse.json({ error: 'studentId، subjectId و type الزامی هستند' }, { status: 400 });
  }

  if (!['teacherClass', 'book'].includes(type)) {
    return NextResponse.json({ error: 'type معتبر نیست' }, { status: 400 });
  }

  if (!(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'دسترسی به تسک‌های این دانش‌آموز مجاز نیست' }, { status: 403 });
  }

  const suggestions = await db.taskDetailSuggestion.findMany({
    where: { studentId, subjectId, type },
    select: { value: true },
    orderBy: { createdAt: 'desc' },
  });

  const values = suggestions.map((s) => s.value);
  return NextResponse.json({ values });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const body = await request.json();
  const { studentId, subjectId, type, value } = body;

  if (!studentId || !subjectId || !type || !value || typeof value !== 'string' || value.trim() === '') {
    return NextResponse.json({ error: 'studentId، subjectId، type و value معتبر الزامی هستند' }, { status: 400 });
  }

  if (!['teacherClass', 'book'].includes(type)) {
    return NextResponse.json({ error: 'type معتبر نیست' }, { status: 400 });
  }

  if (!(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'دسترسی به تسک‌های این دانش‌آموز مجاز نیست' }, { status: 403 });
  }

  await db.taskDetailSuggestion.upsert({
    where: {
      studentId_subjectId_type_value: {
        studentId,
        subjectId,
        type,
        value: value.trim(),
      },
    },
    create: {
      studentId,
      subjectId,
      type,
      value: value.trim(),
    },
    update: {
      createdAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
