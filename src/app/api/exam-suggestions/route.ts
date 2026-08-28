import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';

async function authorize(request: NextRequest, studentId: unknown) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return { error };
  if (typeof studentId !== 'string' || !(await canViewStudentTasks(ctx, studentId))) {
    return { error: NextResponse.json({ error: 'دسترسی به پیشنهادهای این دانش‌آموز مجاز نیست' }, { status: 403 }) };
  }
  return { ctx };
}

export async function GET(request: NextRequest) {
  const studentId = new URL(request.url).searchParams.get('studentId');
  const { error } = await authorize(request, studentId);
  if (error) return error;
  const suggestions = await db.examTitleSuggestion.findMany({
    where: { studentId: studentId! },
    select: { value: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({ values: suggestions.map((item) => item.value) });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { error } = await authorize(request, body.studentId);
  if (error) return error;
  if (typeof body.value !== 'string' || !body.value.trim()) {
    return NextResponse.json({ error: 'عنوان آزمون معتبر نیست' }, { status: 400 });
  }
  await db.examTitleSuggestion.deleteMany({
    where: { studentId: body.studentId, value: body.value.trim() },
  });
  return NextResponse.json({ success: true });
}
