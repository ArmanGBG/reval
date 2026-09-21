import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';

/**
 * DELETE /api/exams/[id]/analysis/[taskId]
 *
 * Permanently deletes one ExamAnalysisTask record.
 *
 * Authorization:
 * - The student who owns the task (task.studentId === ctx.userId).
 * - The advisor who created the task (task.createdById === ctx.userId).
 * - A super admin.
 *
 * FK safety (no schema/migration change required):
 * - The `creator` relation has no explicit `onDelete` policy, so Prisma's
 *   default (`Restrict`) would block deletion of an advisor who still owns
 *   analysis tasks. We are DELETING the TASK here, not the advisor —
 *   deleting a task row never triggers any restrict on its parent FKs.
 * - The `exam` and `student` relations both use `onDelete: Cascade`, but
 *   those run when an exam or student is deleted, not the other way around.
 * - So `db.examAnalysisTask.delete()` is safe in every direction.
 *
 * If the task does not exist, returns 404. If the caller is neither the
 * owning student, the creator advisor, nor a super admin, returns 403.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const { id: examId, taskId } = await params;

  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const task = await db.examAnalysisTask.findUnique({
    where: { id: taskId },
    select: { id: true, examId: true, studentId: true, createdById: true },
  });

  if (!task || task.examId !== examId) {
    return NextResponse.json({ error: 'تسک تحلیل یافت نشد' }, { status: 404 });
  }

  // Authorization — three allowed cases:
  // 1. The owning student (also must be allowed to view tasks per institute rules).
  // 2. The advisor who created the task.
  // 3. Super admin override.
  const isOwnerStudent = task.studentId === ctx.userId
    && (ctx.user.role === 'STUDENT' || ctx.user.role === 'SUPER_ADMIN');
  const isCreatorAdvisor = task.createdById === ctx.userId && ctx.user.role === 'ADVISOR';
  const isSuperAdmin = ctx.user.role === 'SUPER_ADMIN';

  const canDelete = isOwnerStudent || isCreatorAdvisor || isSuperAdmin;

  if (!canDelete) {
    // Even a student's assigned advisor is not allowed to delete the task
    // outright — they should PATCH the advisorNote / date instead. Only the
    // original creator advisor may remove their own task.
    if (ctx.user.role === 'ADVISOR') {
      const canViewStudent = await canViewStudentTasks(ctx, task.studentId);
      if (!canViewStudent) {
        return NextResponse.json({ error: 'دسترسی به تحلیل این دانش‌آموز مجاز نیست' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'حذف این تسک تحلیل مجاز نیست' }, { status: 403 });
  }

  try {
    await db.examAnalysisTask.delete({ where: { id: taskId } });
  } catch (err) {
    console.error('DELETE /api/exams/[id]/analysis/[taskId] error:', err);
    return NextResponse.json({ error: 'حذف تسک تحلیل ناموفق بود' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
