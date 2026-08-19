import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { supportsFinalAssessment } from '@/lib/subject-eligibility';

// GET /api/subjects/for-task
// Query: ?fieldType=کنکور&grade=دوازدهم&major=تجربی
// Authorization: any authenticated user (students + advisors creating tasks).
//
// Logic:
//   Eligibility is scoped to each subject + grade + major offering.
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
  const allGrades = searchParams.get('allGrades') === 'true';

  if (!fieldType || !grade || !major) {
    return NextResponse.json(
      { error: 'fieldType, grade, major are required' },
      { status: 400 },
    );
  }
  if (fieldType !== 'کنکور' && fieldType !== 'نهایی') return NextResponse.json({ error: 'fieldType نامعتبر است' }, { status: 400 });

  const where: Record<string, unknown> = { isActive: true };
  // Grade-ten books are not final-exam offerings. Keep this guard at the API
  // boundary as well as in imported data so stale databases cannot expose it.
  if (fieldType === 'نهایی' && !supportsFinalAssessment(grade) && !allGrades) {
    return NextResponse.json({ subjects: [], fieldType, grade, major });
  }
  const eligibility = fieldType === 'کنکور' ? { isKonkur: true } : { isFinal: true };
  const gradeFilter = fieldType === 'کنکور' || allGrades
    ? { major, isActive: true, ...eligibility, ...(fieldType === 'نهایی' ? { grade: { not: 'دهم' } } : {}) }
    : { grade, major, isActive: true, ...eligibility };
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
          topicModes: {
            where: { isActive: true },
            orderBy: { modeNo: 'asc' },
            include: {
              subtopics: { where: { isActive: true }, orderBy: { subtopicNo: 'asc' } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ subjects, fieldType, grade, major });
}
