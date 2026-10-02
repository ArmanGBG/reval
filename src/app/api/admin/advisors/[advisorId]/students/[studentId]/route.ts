import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { detachStudent } from '@/lib/user-lifecycle';

// ===== DELETE /api/admin/advisors/[advisorId]/students/[studentId] =====
// Removes connection between student and advisor (sets assignedAdvisorId to null and marks connection ENDED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ advisorId: string; studentId: string }> },
) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  const { advisorId, studentId } = await params;
  if (!advisorId || !studentId) {
    return NextResponse.json({ error: 'اطلاعات درخواست ناقص است' }, { status: 400 });
  }

  try {
    await db.$transaction((tx) => detachStudent(tx, studentId));
    return NextResponse.json({ success: true, studentId, advisorId });
  } catch (err) {
    console.error('Error removing connection:', err);
    return NextResponse.json({ error: 'خطا در حذف ارتباط با مشاور' }, { status: 500 });
  }
}
