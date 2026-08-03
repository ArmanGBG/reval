import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/:subjectId/chapters
// Optional: ?grade=دهم
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');

  const chapters = await db.chapter.findMany({
    where: {
      subjectId,
      isActive: true,
      ...(grade ? { grade } : {}),
    },
    orderBy: [{ grade: 'asc' }, { chapterNo: 'asc' }],
    include: { topics: { where: { isActive: true }, orderBy: { topicNo: 'asc' } } },
  });

  return NextResponse.json({ chapters });
}

// POST /api/subjects/:subjectId/chapters
// Body: { grade, title, chapterNo?, assessmentType?, weight? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  try {
    const body = await request.json();
    const { grade, title, chapterNo, assessmentType, weight } = body;

    if (!grade || !title) {
      return NextResponse.json({ error: 'پایه و عنوان فصل الزامی است' }, { status: 400 });
    }

    // Determine next chapterNo if not provided
    let nextNo = chapterNo;
    if (typeof nextNo !== 'number') {
      const last = await db.chapter.findFirst({
        where: { subjectId, grade },
        orderBy: { chapterNo: 'desc' },
      });
      nextNo = last ? last.chapterNo + 1 : 1;
    }

    const chapter = await db.chapter.create({
      data: {
        subjectId,
        grade,
        title,
        chapterNo: nextNo,
        sortOrder: nextNo,
        assessmentType: assessmentType || null,
        weight: typeof weight === 'number' ? weight : null,
      },
      include: { topics: true },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    console.error('POST chapter error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد فصل' }, { status: 500 });
  }
}
