import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/subjects/:subjectId/page-lookup?gradeSubjectId=xxx&page=15
// Authorization: any authenticated user.
//
// Resolves a textbook page number to its chapter (and topic if applicable).
//
// Algorithm:
//   1. Fetch all chapters (with topics) for the gradeSubjectId, ordered by chapterNo.
//   2. Search bounded topic ranges first.
//   3. If no topic match, search bounded chapter ranges.
//   4. If no exact match (gap between chapters), return the nearest previous
//      chapter (last chapter where pageStart <= page) with status="unmapped".
//   5. If no chapter has pageStart <= page at all, return status="not_found".
//
// Response shapes:
//   { status: "exact",    chapter: {...}, topic?: {...} }   // topic included for topic-level matches
//   { status: "unmapped", chapter: {...} }                  // gap between chapters
//   { status: "not_found" }                                  // page before first chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { subjectId } = await params;
  const { searchParams } = new URL(request.url);
  const gradeSubjectId = searchParams.get('gradeSubjectId');
  const pageStr = searchParams.get('page');

  if (!gradeSubjectId) {
    return NextResponse.json(
      { error: 'gradeSubjectId الزامی است' },
      { status: 400 },
    );
  }
  if (!pageStr) {
    return NextResponse.json({ error: 'page الزامی است' }, { status: 400 });
  }
  const page = Number(pageStr);
  if (!Number.isInteger(page) || page < 1) {
    return NextResponse.json(
      { error: 'page باید عدد صحیح مثبت باشد' },
      { status: 400 },
    );
  }

  // Verify gradeSubject belongs to subject in path.
  const gradeSubject = await db.gradeSubject.findFirst({
    where: { id: gradeSubjectId, subjectId, isActive: true, subject: { isActive: true } },
    select: { subjectId: true },
  });
  if (!gradeSubject) {
    return NextResponse.json(
      { error: 'پایه-درس متعلق به این درس نیست' },
      { status: 404 },
    );
  }

  // Fetch all chapters with topics, ordered by chapterNo.
  const chapters = await db.chapter.findMany({
    where: { gradeSubjectId, isActive: true },
    orderBy: { chapterNo: 'asc' },
    include: {
      topics: {
        where: { isActive: true },
        orderBy: { topicNo: 'asc' },
      },
    },
  });

  if (chapters.length === 0) {
    return NextResponse.json({ status: 'not_found' });
  }

  // Null or incomplete ranges are unmapped and cannot match a page.
  function matchesPage(e: {
    pageStart: number | null;
    pageEnd: number | null;
  }): boolean {
    if (e.pageStart === null || e.pageEnd === null) return false;
    return page >= e.pageStart && page <= e.pageEnd;
  }

  // 1) Search topics first (across all chapters in order).
  for (const ch of chapters) {
    for (const tp of ch.topics) {
      if (matchesPage(tp)) {
        return NextResponse.json({
          status: 'exact',
          chapter: ch,
          topic: tp,
        });
      }
    }
  }

  // 2) Search chapters.
  for (const ch of chapters) {
    if (matchesPage(ch)) {
      return NextResponse.json({
        status: 'exact',
        chapter: ch,
      });
    }
  }

  // 3) No exact match — find nearest previous chapter
  //    (last bounded chapter where pageStart <= page).
  let nearestPrev: (typeof chapters)[number] | null = null;
  for (const ch of chapters) {
    if (ch.pageStart !== null && ch.pageEnd !== null && ch.pageStart <= page) {
      nearestPrev = ch;
    }
  }

  if (nearestPrev) {
    return NextResponse.json({
      status: 'unmapped',
      chapter: nearestPrev,
    });
  }

  // 4) No chapter even has pageStart <= page.
  return NextResponse.json({ status: 'not_found' });
}
