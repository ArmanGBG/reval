import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

// PATCH /api/subjects/:subjectId/grades/:gradeSubjectId
// Body: { sortOrder?, isActive? }
// (grade + major are immutable after creation; create a new one if needed.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; gradeSubjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { gradeSubjectId } = await params;
  try {
    const body = await request.json();
    const allowed = ['sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const gradeSubject = await db.gradeSubject.update({
      where: { id: gradeSubjectId },
      data,
    });
    return NextResponse.json({ gradeSubject });
  } catch (error) {
    console.error('PATCH grade-subject error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی پایه' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId/grades/:gradeSubjectId — soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; gradeSubjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { gradeSubjectId } = await params;
  try {
    await db.gradeSubject.update({
      where: { id: gradeSubjectId },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE grade-subject error:', error);
    return NextResponse.json({ error: 'خطا در حذف پایه' }, { status: 500 });
  }
}
