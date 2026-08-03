import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/:subjectId/grades
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const grades = await db.gradeSubject.findMany({
    where: { subjectId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ grades });
}

// POST /api/subjects/:subjectId/grades
// Body: { grade, major, depth?, allowOptionalSubtopic?, sortOrder? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  try {
    const body = await request.json();
    const { grade, major, depth, allowOptionalSubtopic, sortOrder } = body;
    if (!grade || !major) {
      return NextResponse.json({ error: 'پایه و رشته الزامی است' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db.gradeSubject.findUnique({
      where: { subjectId_grade_major: { subjectId, grade, major } },
    });
    if (existing) {
      return NextResponse.json({ error: 'این پایه و رشته قبلاً ثبت شده' }, { status: 409 });
    }

    const gradeSubject = await db.gradeSubject.create({
      data: {
        subjectId,
        grade,
        major,
        depth: typeof depth === 'number' ? depth : 2,
        allowOptionalSubtopic: Boolean(allowOptionalSubtopic),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });
    return NextResponse.json({ gradeSubject }, { status: 201 });
  } catch (error) {
    console.error('POST grade-subject error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد پایه برای درس' }, { status: 500 });
  }
}
