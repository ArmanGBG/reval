import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';

// DELETE /api/sleep/[id] — students delete their own records; assigned
// advisors can too (same rule as creation).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  const { id } = await params;
  const record = await db.sleepRecord.findUnique({ where: { id }, select: { id: true, studentId: true } });
  if (!record) return NextResponse.json({ error: 'رکورد یافت نشد' }, { status: 404 });
  const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === record.studentId;
  const isManagingAdvisor = ctx.user.role === 'ADVISOR' && (await canViewStudentTasks(ctx, record.studentId));
  if (!isSelf && !isManagingAdvisor) {
    return NextResponse.json({ error: 'اجازه حذف این رکورد را ندارید' }, { status: 403 });
  }
  await db.sleepRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
