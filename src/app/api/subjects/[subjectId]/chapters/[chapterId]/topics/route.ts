import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole, verifyChapterOwnershipWithTopics } from '@/lib/api-auth';
import {
  validateSequenceNumber,
  validatePageRange,
  normalizePageRange,
  findOverlap,
  validateTopicWithinChapter,
  type RangeEntry,
} from '@/lib/validators/page-range';

// GET /api/subjects/:subjectId/chapters/:chapterId/topics
// Authorization: any authenticated user. Chapter must belong to subject in path.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> },
) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { subjectId, chapterId } = await params;

  // Ownership check: chapter must belong to subject in path (bug 9)
  const chapter = await verifyChapterOwnershipWithTopics(subjectId, chapterId);
  if (!chapter) {
    return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
  }

  const topics = await db.topic.findMany({
    where: { chapterId, isActive: true },
    orderBy: { topicNo: 'asc' },
  });
  return NextResponse.json({ topics });
}

// POST /api/subjects/:subjectId/chapters/:chapterId/topics
// Body: { title, topicNo?, pageStart?, pageEnd? }
//
// Validation (API is the source of truth):
//   - topicNo: integer >= 0 (if provided; 0 is reserved for book prefaces)
//   - pageStart/pageEnd: both positive integers or both null/unset
//   - Topic range must be within parent chapter's range
//   - No overlapping topic ranges within the same chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId, chapterId } = await params;
  try {
    const body = await request.json();
    const { title, topicNo, pageStart, pageEnd } = body;
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان گفتار الزامی است' },
        { status: 400 },
      );
    }

    // Validate topicNo (if provided)
    if (topicNo !== undefined) {
      const noErr = validateSequenceNumber(topicNo, 'شماره گفتار', 0);
      if (noErr) {
        return NextResponse.json({ error: noErr.message }, { status: 400 });
      }
    }

    // Validate page range
    const pageErr = validatePageRange({ pageStart, pageEnd });
    if (pageErr) {
      return NextResponse.json({ error: pageErr.message }, { status: 400 });
    }

    const normalized = normalizePageRange({ pageStart, pageEnd });

    // Ownership check: chapter must belong to subject in path (bug 9)
    const chapter = await verifyChapterOwnershipWithTopics(subjectId, chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'فصل متعلق به این درس نیست' }, { status: 404 });
    }

    // Validate topic range is within chapter range
    const withinErr = validateTopicWithinChapter(normalized, chapter as RangeEntry);
    if (withinErr) {
      return NextResponse.json({ error: withinErr.message }, { status: 400 });
    }

    // Determine next topicNo — only count ACTIVE topics (bug 11: soft-deleted
    // topics shouldn't inflate the next number)
    let nextNo = topicNo;
    if (typeof nextNo !== 'number') {
      const last = await db.topic.findFirst({
        where: { chapterId, isActive: true },
        orderBy: { topicNo: 'desc' },
      });
      nextNo = last ? last.topicNo + 1 : 1;
    }

    // Reactivation check (bug 11): if a soft-deleted topic with the same
    // chapterId + topicNo exists, reactivate it instead of creating a new
    // record (avoids unique constraint violation).
    const existingTopic = await db.topic.findUnique({
      where: { chapterId_topicNo: { chapterId, topicNo: nextNo } },
    });
    if (existingTopic?.isActive) {
      return NextResponse.json(
        { error: 'گفتاری با این شماره قبلاً ثبت شده' },
        { status: 409 },
      );
    }

    // Fetch active sibling topics for overlap checks.
    const siblings = await db.topic.findMany({
      where: {
        chapterId,
        isActive: true,
        ...(existingTopic ? { id: { not: existingTopic.id } } : {}),
      },
      select: { id: true, pageStart: true, pageEnd: true },
    });

    // Overlap check
    if (normalized.pageStart !== null) {
      const candidate: RangeEntry = {
        id: existingTopic?.id ?? 'new',
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
      };
      const overlap = findOverlap(candidate, siblings as RangeEntry[]);
      if (overlap) {
        return NextResponse.json(
          { error: 'بازه صفحات این گفتار با گفتار دیگری هم‌پوشانی دارد' },
          { status: 400 },
        );
      }
    }

    if (existingTopic) {
      const reactivated = await db.topic.update({
        where: { id: existingTopic.id },
        data: {
          isActive: true,
          title: title.trim(),
          pageStart: normalized.pageStart,
          pageEnd: normalized.pageEnd,
        },
      });
      return NextResponse.json({ topic: reactivated, reactivated: true });
    }

    const topic = await db.topic.create({
      data: {
        chapterId,
        title: title.trim(),
        topicNo: nextNo,
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
        sortOrder: nextNo,
      },
    });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    console.error('POST topic error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد گفتار' }, { status: 500 });
  }
}
