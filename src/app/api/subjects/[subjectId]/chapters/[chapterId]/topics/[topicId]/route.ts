import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, verifyChapterOwnershipWithTopics } from '@/lib/api-auth';
import {
  validateSequenceNumber,
  validatePageRange,
  normalizePageRange,
  findOverlap,
  validateIsLastPageOnlyLast,
  validateTopicWithinChapter,
  type RangeEntry,
} from '@/lib/validators/page-range';

// PATCH /api/subjects/:subjectId/chapters/:chapterId/topics/:topicId
// Body: { title?, topicNo?, pageStart?, pageEnd?, isLastPage?, sortOrder?, isActive? }
//
// Validation: same as POST — topicNo integer>=1, page range valid, within
// chapter range, no overlaps with siblings, only one isLastPage per chapter.
// Ownership: chapter must belong to subject in path (bug 9 + 10).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string; topicId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId, chapterId, topicId } = await params;
  try {
    const body = await request.json();

    // Ownership check: chapter must belong to subject in path (bug 9 + 10)
    const chapter = await verifyChapterOwnershipWithTopics(subjectId, chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
    }

    // Validate topicNo (if provided)
    if (body.topicNo !== undefined) {
      const noErr = validateSequenceNumber(body.topicNo, 'شماره گفتار');
      if (noErr) {
        return NextResponse.json({ error: noErr.message }, { status: 400 });
      }
    }

    // Fetch existing topic (must belong to chapterId in path)
    const existing = await db.topic.findUnique({ where: { id: topicId } });
    if (!existing || existing.chapterId !== chapterId) {
      return NextResponse.json({ error: 'گفتار متعلق به این فصل نیست' }, { status: 404 });
    }

    // Merge page fields with existing
    const mergedPageStart = body.pageStart !== undefined ? body.pageStart : existing.pageStart;
    const mergedPageEnd = body.pageEnd !== undefined ? body.pageEnd : existing.pageEnd;
    const mergedIsLastPage = body.isLastPage !== undefined ? body.isLastPage : existing.isLastPage;

    // Validate merged range
    const pageErr = validatePageRange({
      pageStart: mergedPageStart,
      pageEnd: mergedPageEnd,
      isLastPage: mergedIsLastPage,
    });
    if (pageErr) {
      return NextResponse.json({ error: pageErr.message }, { status: 400 });
    }

    const normalized = normalizePageRange({
      pageStart: mergedPageStart,
      pageEnd: mergedPageEnd,
      isLastPage: mergedIsLastPage,
    });

    const withinErr = validateTopicWithinChapter(normalized, chapter as RangeEntry);
    if (withinErr) {
      return NextResponse.json({ error: withinErr.message }, { status: 400 });
    }

    // Fetch siblings for overlap + isLastPage checks (exclude self)
    const siblings = await db.topic.findMany({
      where: { chapterId, isActive: true, id: { not: topicId } },
      select: { id: true, pageStart: true, pageEnd: true, isLastPage: true },
    });

    // Overlap check
    if (normalized.pageStart !== null) {
      const candidate: RangeEntry = {
        id: topicId,
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
        isLastPage: normalized.isLastPage,
      };
      const overlap = findOverlap(candidate, siblings as RangeEntry[]);
      if (overlap) {
        return NextResponse.json(
          { error: 'بازه صفحات این گفتار با گفتار دیگری هم‌پوشانی دارد' },
          { status: 400 },
        );
      }
    }

    // isLastPage uniqueness
    if (normalized.isLastPage) {
      const isLastErr = validateIsLastPageOnlyLast(
        { id: topicId, pageStart: normalized.pageStart, pageEnd: normalized.pageEnd, isLastPage: true },
        siblings as RangeEntry[],
      );
      if (isLastErr) {
        return NextResponse.json({ error: isLastErr.message }, { status: 400 });
      }
    }

    // Build update data
    const data: Record<string, unknown> = {};
    const allowed = ['title', 'topicNo', 'sortOrder', 'isActive'];
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    data.pageStart = normalized.pageStart;
    data.pageEnd = normalized.pageEnd;
    data.isLastPage = normalized.isLastPage;

    const topic = await db.topic.update({ where: { id: topicId }, data });
    return NextResponse.json({ topic });
  } catch (error) {
    console.error('PATCH topic error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی گفتار' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId/chapters/:chapterId/topics/:topicId — soft delete
// Ownership: chapter must belong to subject in path, topic must belong to chapter (bug 9 + 10).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string; topicId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId, chapterId, topicId } = await params;

  // Ownership check: chapter must belong to subject in path
  const chapter = await verifyChapterOwnershipWithTopics(subjectId, chapterId);
  if (!chapter) {
    return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
  }

  try {
    // Verify topic belongs to chapter (not just any topic by ID)
    const topic = await db.topic.findUnique({ where: { id: topicId } });
    if (!topic || topic.chapterId !== chapterId) {
      return NextResponse.json({ error: 'گفتار متعلق به این فصل نیست' }, { status: 404 });
    }
    await db.topic.update({ where: { id: topicId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE topic error:', error);
    return NextResponse.json({ error: 'خطا در حذف گفتار' }, { status: 500 });
  }
}
