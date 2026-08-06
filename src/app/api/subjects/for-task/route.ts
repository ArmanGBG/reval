import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// GET /api/subjects/for-task
// Query: ?fieldType=کنکور&grade=دوازدهم&major=تجربی
// Authorization: any authenticated user (students + advisors creating tasks).
//
// Logic:
//   fieldType=کنکور → subjects where isKonkur=true
//   fieldType=نهایی  → return ALL active subjects (no isKonkur filter)
//
// Also filters by grade+major via GradeSubject pivot, and returns the full tree
// (grades config → chapters → topics, plus topicModes) for each subject so the
// client can render the appropriate selector without extra round-trips.
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const fieldType = searchParams.get('fieldType'); // "کنکور" | "نهایی"
  const grade = searchParams.get('grade'); // e.g. "دوازدهم"
  const major = searchParams.get('major'); // e.g. "تجربی"

  if (!fieldType || !grade || !major) {
    return NextResponse.json(
      { error: 'fieldType, grade, major are required' },
      { status: 400 },
    );
  }
  if (fieldType !== 'کنکور' && fieldType !== 'نهایی') return NextResponse.json({ error: 'fieldType نامعتبر است' }, { status: 400 });

  const where: Record<string, unknown> = { isActive: true };
  if (fieldType === 'کنکور') {
    where.isKonkur = true;
  }
  // For نهایی → return ALL active subjects (no isKonkur filter).
  // Filter by grade + major via GradeSubject pivot.
  const gradeFilter = fieldType === 'کنکور'
    ? { major, isActive: true }
    : { grade, major, isActive: true };
  where.grades = { some: gradeFilter };

  const subjects = await db.subject.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      grades: {
        where: gradeFilter,
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

  return NextResponse.json({ subjects, fieldType, grade, major });
}
