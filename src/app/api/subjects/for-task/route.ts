import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/for-task
// Query: ?fieldType=کنکور&grade=دوازدهم&major=تجربی
//
// Logic:
//   fieldType=کنکور → subjects where assessmentType IN ("کنکور","هر دو") AND category="اختصاصی"
//   fieldType=نهایی  → subjects where assessmentType IN ("نهایی","هر دو") (any category)
//
// Also filters by grade+major via GradeSubject pivot, and returns the full tree
// (grades config, chapters, topics, topicModes) for each subject so the client
// can render the appropriate selector without extra round-trips.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fieldType = searchParams.get('fieldType'); // "کنکور" | "نهایی"
  const grade = searchParams.get('grade'); // e.g. "دوازدهم"
  const major = searchParams.get('major'); // e.g. "تجربی"

  if (!fieldType || !grade || !major) {
    return NextResponse.json(
      { error: 'fieldType, grade, major are required' },
      { status: 400 }
    );
  }

  // Build assessment-type filter
  const assessmentTypes: string[] =
    fieldType === 'کنکور'
      ? ['کنکور', 'هر دو']
      : fieldType === 'نهایی'
        ? ['نهایی', 'هر دو']
        : [fieldType];

  // Category filter: کنکوری → only اختصاصی; نهایی → any
  const categoryFilter = fieldType === 'کنکور' ? 'اختصاصی' : undefined;

  const subjects = await db.subject.findMany({
    where: {
      isActive: true,
      assessmentType: { in: assessmentTypes },
      ...(categoryFilter ? { category: categoryFilter } : {}),
      grades: {
        some: {
          grade,
          OR: [{ major }, { major: 'همه' }],
          isActive: true,
        },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      grades: {
        where: {
          OR: [{ major }, { major: 'همه' }],
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      chapters: {
        where: { isActive: true },
        orderBy: [{ grade: 'asc' }, { chapterNo: 'asc' }],
        include: { topics: { where: { isActive: true }, orderBy: { topicNo: 'asc' } } },
      },
      topicModes: {
        where: { isActive: true },
        orderBy: { modeNo: 'asc' },
      },
    },
  });

  return NextResponse.json({ subjects, fieldType, grade, major });
}
