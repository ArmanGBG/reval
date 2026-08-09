import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { normalizeSubjectName } from '@/lib/validators/normalize';

// GET /api/subjects/:subjectId  — single subject with full tree
// (grades → chapters → topics, plus topicModes)
// Authorization: any authenticated user.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { subjectId } = await params;
  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    include: {
      grades: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          chapters: {
            where: { isActive: true },
            orderBy: { chapterNo: 'asc' },
            include: {
              topics: {
                where: { isActive: true },
                orderBy: { topicNo: 'asc' },
              },
            },
          },
        },
      },
      topicModes: {
        where: { isActive: true },
        orderBy: { modeNo: 'asc' },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: 'درس یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ subject });
}

// PATCH /api/subjects/:subjectId
// Body: { name?, color?, icon?, isKonkur?, isActive?, sortOrder? }
// Authorization: SUPER_ADMIN only.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'color', 'icon', 'isKonkur', 'isActive', 'sortOrder'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده' },
        { status: 400 },
      );
    }

    // If renaming, normalize + ensure uniqueness by normalizedName
    if (typeof data.name === 'string') {
      const normalizedName = normalizeSubjectName(data.name);
      if (!normalizedName) {
        return NextResponse.json(
          { error: 'نام درس پس از پردازش خالی است' },
          { status: 400 },
        );
      }
      // Check for clash by normalizedName (so "رياضي" clashes with "ریاضی")
      const clash = await db.subject.findUnique({
        where: { normalizedName },
      });
      if (clash && clash.id !== subjectId) {
        return NextResponse.json(
          { error: 'درسی با این نام (یا معادل نرمال‌شدهٔ آن) قبلاً ثبت شده است' },
          { status: 409 },
        );
      }
      // Store the normalized name alongside the display name
      data.normalizedName = normalizedName;
    }

    const subject = await db.$transaction(async (tx) => {
      const updated = await tx.subject.update({ where: { id: subjectId }, data });
      await tx.task.updateMany({
        where: { subjectId },
        data: { subject: updated.name, subjectColor: updated.color },
      });
      return updated;
    });
    return NextResponse.json({ subject });
  } catch (error) {
    console.error('PATCH subject error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی درس' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId — soft delete
// Authorization: SUPER_ADMIN only.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId } = await params;
  try {
    await db.subject.update({ where: { id: subjectId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE subject error:', error);
    return NextResponse.json({ error: 'خطا در حذف درس' }, { status: 500 });
  }
}
