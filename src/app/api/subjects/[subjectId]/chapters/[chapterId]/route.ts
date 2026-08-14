import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, verifyChapterOwnership } from '@/lib/api-auth';
import {
  validateSequenceNumber,
  validatePageRange,
  normalizePageRange,
  findOverlap,
  validateTopicWithinChapter,
  type RangeEntry,
} from '@/lib/validators/page-range';

// PATCH /api/subjects/:subjectId/chapters/:chapterId
// Body: { title?, chapterNo?, gradeSubjectId?, pageStart?, pageEnd?, sortOrder?, isActive? }
// If gradeSubjectId is being changed, the new gradeSubject must also belong to subjectId.
//
// Validation: same as POST — chapterNo integer>=0, page range valid, no
// overlaps with siblings.
// Ownership: chapter must belong to subject in path (bug 10).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId, chapterId } = await params;
  try {
    const body = await request.json();
    if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) {
      return NextResponse.json({ error: 'عنوان فصل باید متن غیرخالی باشد' }, { status: 400 });
    }

    // Ownership check: chapter must belong to subject in path (bug 10)
    const ownedChapter = await verifyChapterOwnership(subjectId, chapterId);
    if (!ownedChapter) {
      return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
    }

    // Validate chapterNo (if provided)
    if (body.chapterNo !== undefined) {
      const noErr = validateSequenceNumber(body.chapterNo, 'شماره فصل', 0);
      if (noErr) {
        return NextResponse.json({ error: noErr.message }, { status: 400 });
      }
    }

    // Fetch the existing chapter (needed for merging partial page range updates)
    const existing = await db.chapter.findUnique({ where: { id: chapterId } });
    if (!existing) {
      return NextResponse.json({ error: 'فصل یافت نشد' }, { status: 404 });
    }

    // Merge provided page fields with existing values for validation
    const mergedPageStart = body.pageStart !== undefined ? body.pageStart : existing.pageStart;
    const mergedPageEnd = body.pageEnd !== undefined ? body.pageEnd : existing.pageEnd;

    // Validate the merged page range
    const pageErr = validatePageRange({
      pageStart: mergedPageStart,
      pageEnd: mergedPageEnd,
    });
    if (pageErr) {
      return NextResponse.json({ error: pageErr.message }, { status: 400 });
    }

    const normalized = normalizePageRange({
      pageStart: mergedPageStart,
      pageEnd: mergedPageEnd,
    });

    // Determine the effective gradeSubjectId (may be changing)
    const effectiveGradeSubjectId =
      typeof body.gradeSubjectId === 'string' ? body.gradeSubjectId : existing.gradeSubjectId;

    // If moving chapter to a different gradeSubject, verify ownership.
    if (typeof body.gradeSubjectId === 'string') {
      const gs = await db.gradeSubject.findUnique({
        where: { id: body.gradeSubjectId },
      });
      if (!gs || gs.subjectId !== subjectId) {
        return NextResponse.json(
          { error: 'پایه-درس متعلق به این درس نیست' },
          { status: 404 },
        );
      }
    }

    // Fetch siblings for overlap checks (exclude self)
    const siblings = await db.chapter.findMany({
      where: { gradeSubjectId: effectiveGradeSubjectId, isActive: true, id: { not: chapterId } },
      select: { id: true, pageStart: true, pageEnd: true },
    });

    // Overlap check
    if (normalized.pageStart !== null) {
      const candidate: RangeEntry = {
        id: chapterId,
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
      };
      const overlap = findOverlap(candidate, siblings as RangeEntry[]);
      if (overlap) {
        return NextResponse.json(
          { error: 'بازه صفحات این فصل با فصل دیگری هم‌پوشانی دارد' },
          { status: 400 },
        );
      }
    }

    const activeTopics = await db.topic.findMany({
      where: { chapterId, isActive: true },
      select: { id: true, pageStart: true, pageEnd: true },
    });
    for (const topic of activeTopics) {
      const withinErr = validateTopicWithinChapter(topic, {
        id: chapterId,
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
      });
      if (withinErr) {
        return NextResponse.json(
          { error: `بازه صفحات فصل با گفتارهای آن سازگار نیست: ${withinErr.message}` },
          { status: 400 },
        );
      }
    }

    // Build the update data, always including the merged page range.
    const data: Record<string, unknown> = {};
    const allowed = ['title', 'chapterNo', 'gradeSubjectId', 'sortOrder', 'isActive'];
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (typeof data.title === 'string') data.title = data.title.trim();
    if (data.sortOrder !== undefined && (!Number.isInteger(data.sortOrder) || (data.sortOrder as number) < 0)) {
      return NextResponse.json({ error: 'ترتیب باید عدد صحیح نامنفی باشد' }, { status: 400 });
    }
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive باید boolean باشد' }, { status: 400 });
    }
    data.pageStart = normalized.pageStart;
    data.pageEnd = normalized.pageEnd;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'فیلدی برای به‌روزرسانی ارسال نشده' },
        { status: 400 },
      );
    }

    const chapter = await db.$transaction(async (tx) => {
      const updated = await tx.chapter.update({ where: { id: chapterId }, data });
      if (typeof data.title === 'string') {
        await tx.task.updateMany({
          where: { chapterId, topicId: null, topicModeId: null },
          data: { topic: updated.title },
        });
      }
      return updated;
    });
    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('PATCH chapter error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی فصل' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId/chapters/:chapterId — soft delete
// Ownership: chapter must belong to subject in path (bug 10).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId, chapterId } = await params;

  // Ownership check: chapter must belong to subject in path
  const chapter = await verifyChapterOwnership(subjectId, chapterId);
  if (!chapter) {
    return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
  }

  try {
    await db.chapter.update({
      where: { id: chapterId },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE chapter error:', error);
    return NextResponse.json({ error: 'خطا در حذف فصل' }, { status: 500 });
  }
}
