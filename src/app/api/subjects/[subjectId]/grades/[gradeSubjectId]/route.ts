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

  const { subjectId, gradeSubjectId } = await params;
  try {
    const body = await request.json();
    const existing = await db.gradeSubject.findFirst({ where: { id: gradeSubjectId, subjectId, subject: { isActive: true } } });
    if (!existing) return NextResponse.json({ error: 'پایه متعلق به این درس نیست' }, { status: 404 });
    const allowed = ['sortOrder', 'isActive', 'isKonkur', 'isFinal'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'هیچ تغییری ارسال نشده است' }, { status: 400 });
    const nextKonkur = typeof data.isKonkur === 'boolean' ? data.isKonkur : existing.isKonkur;
    const nextFinal = typeof data.isFinal === 'boolean' ? data.isFinal : existing.isFinal;
    if (data.isKonkur !== undefined && typeof data.isKonkur !== 'boolean') {
      return NextResponse.json({ error: 'isKonkur باید boolean باشد' }, { status: 400 });
    }
    if (data.isFinal !== undefined && typeof data.isFinal !== 'boolean') {
      return NextResponse.json({ error: 'isFinal باید boolean باشد' }, { status: 400 });
    }
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive باید boolean باشد' }, { status: 400 });
    }
    if (data.sortOrder !== undefined && (!Number.isInteger(data.sortOrder) || (data.sortOrder as number) < 0)) {
      return NextResponse.json({ error: 'ترتیب باید عدد صحیح نامنفی باشد' }, { status: 400 });
    }
    const nextActive = typeof data.isActive === 'boolean' ? data.isActive : existing.isActive;
    if (nextActive && !nextKonkur && !nextFinal) {
      return NextResponse.json({ error: 'حداقل یکی از وضعیت‌های کنکور یا نهایی باید فعال باشد' }, { status: 400 });
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

  const { subjectId, gradeSubjectId } = await params;
  try {
    const existing = await db.gradeSubject.findFirst({ where: { id: gradeSubjectId, subjectId, subject: { isActive: true } } });
    if (!existing) return NextResponse.json({ error: 'پایه متعلق به این درس نیست' }, { status: 404 });
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
