import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  const { id } = await params;
  const body = await request.json();
  const studentId = ctx.user.role === 'STUDENT' ? ctx.userId : body.studentId;
  if (ctx.user.role !== 'STUDENT' || typeof studentId !== 'string' || !(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'فقط دانش‌آموز می‌تواند یادداشت تحلیل درسی خودش را ثبت کند' }, { status: 403 });
  }
  const subjectName = typeof body.subjectName === 'string' ? body.subjectName.trim() : '';
  if (!subjectName || subjectName.length > 100 || typeof body.analyzed !== 'boolean' || (body.note != null && typeof body.note !== 'string')) {
    return NextResponse.json({ error: 'اطلاعات تحلیل درس معتبر نیست' }, { status: 400 });
  }
  const participant = await db.examParticipant.findUnique({ where: { examId_studentId: { examId: id, studentId } } });
  if (!participant) return NextResponse.json({ error: 'آزمون برای این دانش‌آموز یافت نشد' }, { status: 404 });
  const analysis = await db.examSubjectAnalysis.upsert({
    where: { examId_studentId_subjectName: { examId: id, studentId, subjectName } },
    create: { examId: id, studentId, subjectName, analyzed: body.analyzed, note: body.note?.trim() || null },
    update: { analyzed: body.analyzed, note: body.note?.trim() || null },
  });
  return NextResponse.json({ analysis: { ...analysis, updatedAt: analysis.updatedAt.toISOString() } });
}
