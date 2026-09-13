import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';

// DELETE /api/non-study-activities/[id]
// Students delete their own activities; their assigned advisor can too.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  const { id } = await params;
  const activity = await db.nonStudyActivity.findUnique({ where: { id }, select: { id: true, studentId: true } });
  if (!activity) return NextResponse.json({ error: 'فعالیت یافت نشد' }, { status: 404 });
  const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === activity.studentId;
  const isManagingAdvisor = ctx.user.role === 'ADVISOR' && (await canViewStudentTasks(ctx, activity.studentId));
  if (!isSelf && !isManagingAdvisor) {
    return NextResponse.json({ error: 'اجازه حذف این فعالیت را ندارید' }, { status: 403 });
  }
  await db.nonStudyActivity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
