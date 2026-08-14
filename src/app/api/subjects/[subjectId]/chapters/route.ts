import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import {
  validateSequenceNumber,
  validatePageRange,
  normalizePageRange,
  findOverlap,
  validateTopicWithinChapter,
  type RangeEntry,
} from '@/lib/validators/page-range';

// GET /api/subjects/:subjectId/chapters
// Optional: ?gradeSubjectId=xxx → filter chapters of a specific grade-subject pivot.
// Chapters belong to GradeSubject; only chapters whose gradeSubject.subjectId === subjectId
// are returned (the subjectId in the path acts as a safety check).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { subjectId } = await params;
  const { searchParams } = new URL(request.url);
  const gradeSubjectId = searchParams.get('gradeSubjectId');

  const chapters = await db.chapter.findMany({
    where: {
      isActive: true,
      gradeSubject: { subjectId, isActive: true },
      ...(gradeSubjectId ? { gradeSubjectId } : {}),
    },
    orderBy: [{ chapterNo: 'asc' }],
    include: {
      topics: {
        where: { isActive: true },
        orderBy: { topicNo: 'asc' },
      },
    },
  });

  return NextResponse.json({ chapters });
}

// POST /api/subjects/:subjectId/chapters
// Body: { gradeSubjectId, title, chapterNo?, pageStart?, pageEnd? }
// The gradeSubjectId must belong to the subject in the path.
//
// Validation (API is the source of truth):
//   - chapterNo: integer >= 0 (if provided; 0 is reserved for book prefaces)
//   - pageStart/pageEnd: both positive integers or both null/unset
//   - pageEnd >= pageStart
//   - No overlapping chapter ranges within the same gradeSubject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId } = await params;
  try {
    const body = await request.json();
    const { gradeSubjectId, title, chapterNo, pageStart, pageEnd } = body;

    if (typeof gradeSubjectId !== 'string' || !gradeSubjectId || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'شناسه پایه-درس و عنوان فصل الزامی است' },
        { status: 400 },
      );
    }

    // Verify gradeSubject belongs to subject in path
    const gradeSubject = await db.gradeSubject.findUnique({
      where: { id: gradeSubjectId },
    });
    if (!gradeSubject || gradeSubject.subjectId !== subjectId || !gradeSubject.isActive) {
      return NextResponse.json(
        { error: 'پایه-درس متعلق به این درس نیست' },
        { status: 404 },
      );
    }

    // Validate chapterNo (if provided)
    if (chapterNo !== undefined) {
      const noErr = validateSequenceNumber(chapterNo, 'شماره فصل', 0);
      if (noErr) {
        return NextResponse.json({ error: noErr.message }, { status: 400 });
      }
    }

    // Validate page range fields
    const pageErr = validatePageRange({ pageStart, pageEnd });
    if (pageErr) {
      return NextResponse.json({ error: pageErr.message }, { status: 400 });
    }

    const normalized = normalizePageRange({ pageStart, pageEnd });

    // Determine next chapterNo if not provided — only count ACTIVE chapters
    // (bug 11: soft-deleted chapters shouldn't inflate the next number)
    let nextNo = chapterNo;
    if (typeof nextNo !== 'number') {
      const last = await db.chapter.findFirst({
        where: { gradeSubjectId, isActive: true },
        orderBy: { chapterNo: 'desc' },
      });
      nextNo = last ? last.chapterNo + 1 : 1;
    }

    // Reactivation check (bug 11): if a soft-deleted chapter with the same
    // gradeSubjectId + chapterNo exists, reactivate it instead of creating a
    // new record (avoids unique constraint violation).
    const existingChapter = await db.chapter.findUnique({
      where: { gradeSubjectId_chapterNo: { gradeSubjectId, chapterNo: nextNo } },
    });
    if (existingChapter) {
      if (existingChapter.isActive) {
        return NextResponse.json(
          { error: 'فصلی با این شماره قبلاً ثبت شده' },
          { status: 409 },
        );
      }
      // Fetch active siblings for overlap checks (exclude the reactivating one)
      const activeSiblings = await db.chapter.findMany({
        where: { gradeSubjectId, isActive: true, id: { not: existingChapter.id } },
        select: { id: true, pageStart: true, pageEnd: true },
      });
      // Overlap check
      if (normalized.pageStart !== null) {
        const candidate: RangeEntry = {
          id: existingChapter.id,
          pageStart: normalized.pageStart,
          pageEnd: normalized.pageEnd,
        };
        const overlap = findOverlap(candidate, activeSiblings as RangeEntry[]);
        if (overlap) {
          return NextResponse.json(
            { error: 'بازه صفحات این فصل با فصل دیگری هم‌پوشانی دارد' },
            { status: 400 },
          );
        }
      }
      const activeTopics = await db.topic.findMany({
        where: { chapterId: existingChapter.id, isActive: true },
        select: { id: true, pageStart: true, pageEnd: true },
      });
      for (const topic of activeTopics) {
        const withinErr = validateTopicWithinChapter(topic, {
          id: existingChapter.id,
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
      // Reactivate
      const reactivated = await db.chapter.update({
        where: { id: existingChapter.id },
        data: {
          isActive: true,
          title: title.trim(),
          pageStart: normalized.pageStart,
          pageEnd: normalized.pageEnd,
        },
        include: { topics: true },
      });
      return NextResponse.json({ chapter: reactivated, reactivated: true });
    }

    // Fetch existing active chapters for overlap checks
    const existingChapters = await db.chapter.findMany({
      where: { gradeSubjectId, isActive: true },
      select: { id: true, pageStart: true, pageEnd: true, chapterNo: true },
    });

    // Overlap check (only if this chapter has a pageStart)
    if (normalized.pageStart !== null) {
      const candidate: RangeEntry = {
        id: 'new', // placeholder for new chapter
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
      };
      const overlap = findOverlap(candidate, existingChapters as RangeEntry[]);
      if (overlap) {
        return NextResponse.json(
          { error: 'بازه صفحات این فصل با فصل دیگری هم‌پوشانی دارد' },
          { status: 400 },
        );
      }
    }

    const chapter = await db.chapter.create({
      data: {
        gradeSubjectId,
        title: title.trim(),
        chapterNo: nextNo,
        pageStart: normalized.pageStart,
        pageEnd: normalized.pageEnd,
        sortOrder: nextNo,
      },
      include: { topics: true },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error('POST chapter error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد فصل' }, { status: 500 });
  }
}
