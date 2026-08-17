import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { assignAdvisor } from '@/lib/user-lifecycle';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId: studentId } = await params;
  const body = await request.json();
  const advisorId = body.advisorId === null ? null : typeof body.advisorId === 'string' ? body.advisorId : undefined;
  if (advisorId === undefined) return NextResponse.json({ error: 'مشاور معتبر نیست' }, { status: 400 });
  try {
    await db.$transaction((tx) => assignAdvisor(tx, studentId, advisorId));
    return NextResponse.json({ success: true, studentId, advisorId });
  } catch (assignmentError) {
    const message = assignmentError instanceof Error ? assignmentError.message : '';
    if (message === 'STUDENT_INVALID') return NextResponse.json({ error: 'دانش‌آموز فعال یافت نشد' }, { status: 404 });
    if (message === 'ADVISOR_INVALID') return NextResponse.json({ error: 'مشاور فعال یافت نشد' }, { status: 404 });
    if (message === 'INSTITUTE_MISMATCH') return NextResponse.json({ error: 'دانش‌آموز و مشاور باید عضو یک آموزشگاه باشند یا هر دو بدون آموزشگاه باشند' }, { status: 409 });
    throw assignmentError;
  }
}
