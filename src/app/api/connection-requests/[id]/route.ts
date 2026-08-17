import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { assignAdvisor } from '@/lib/user-lifecycle';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireRole(request, ['STUDENT', 'ADVISOR']);
  if (error || !ctx) return error;
  const { id } = await params;
  const body = await request.json();
  const action = body.action;
  const connection = await db.connectionRequest.findUnique({ where: { id } });
  if (!connection || (ctx.user.role === 'STUDENT' ? connection.studentId !== ctx.userId : connection.advisorId !== ctx.userId)) {
    return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 });
  }
  if (action === 'END') {
    if (connection.status !== 'ACCEPTED') return NextResponse.json({ error: 'همکاری فعالی وجود ندارد' }, { status: 409 });
    await db.$transaction(async (tx) => {
      await tx.connectionRequest.update({ where: { id }, data: { status: 'ENDED', respondedAt: new Date() } });
      await tx.user.updateMany({ where: { id: connection.studentId, assignedAdvisorId: connection.advisorId }, data: { assignedAdvisorId: null } });
    });
    return NextResponse.json({ message: 'همکاری پایان یافت' });
  }
  if (connection.status !== 'PENDING') return NextResponse.json({ error: 'این درخواست دیگر فعال نیست' }, { status: 409 });
  const isTarget = connection.initiatedBy !== ctx.user.role;
  if ((action === 'ACCEPT' || action === 'REJECT') && !isTarget) return NextResponse.json({ error: 'فقط دریافت‌کننده درخواست می‌تواند پاسخ دهد' }, { status: 403 });
  if (action === 'CANCEL' && isTarget) return NextResponse.json({ error: 'فقط ایجادکننده درخواست می‌تواند آن را لغو کند' }, { status: 403 });
  if (!['ACCEPT', 'REJECT', 'CANCEL'].includes(action)) return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  const status = action === 'ACCEPT' ? 'ACCEPTED' : action === 'REJECT' ? 'REJECTED' : 'CANCELLED';
  const updated = await db.$transaction(async (tx) => {
    const result = await tx.connectionRequest.update({ where: { id }, data: { status, respondedAt: new Date() } });
    if (action === 'ACCEPT') {
      const student = await tx.user.findUnique({ where: { id: connection.studentId }, select: { assignedAdvisorId: true } });
      if (student?.assignedAdvisorId && student.assignedAdvisorId !== connection.advisorId) throw new Error('STUDENT_ALREADY_ASSIGNED');
      await assignAdvisor(tx, connection.studentId, connection.advisorId);
    }
    return result;
  }).catch((transactionError) => {
    if (transactionError instanceof Error && transactionError.message === 'STUDENT_ALREADY_ASSIGNED') return null;
    throw transactionError;
  });
  if (!updated) return NextResponse.json({ error: 'دانش‌آموز مشاور دیگری دارد' }, { status: 409 });
  return NextResponse.json({ request: updated });
}
