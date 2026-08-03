import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects
// Optional query params:
//   ?grade=دهم&major=تجربی   → filter by GradeSubject
//   ?include=tree            → include grades, chapters, topics, topicModes
//   ?assessmentType=کنکور   → filter by assessment type
//   ?category=اختصاصی        → filter by category
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const major = searchParams.get('major');
  const includeTree = searchParams.get('include') === 'tree';
  const assessmentType = searchParams.get('assessmentType');
  const category = searchParams.get('category');

  const where: Record<string, unknown> = { isActive: true };
  if (assessmentType) where.assessmentType = assessmentType;
  if (category) where.category = category;
  if (grade || major) {
    where.grades = {
      some: {
        ...(grade ? { grade } : {}),
        ...(major ? { major } : {}),
        isActive: true,
      },
    };
  }

  const subjects = await db.subject.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: includeTree
      ? {
          grades: { orderBy: { sortOrder: 'asc' } },
          chapters: {
            orderBy: [{ grade: 'asc' }, { chapterNo: 'asc' }],
            include: { topics: { orderBy: { topicNo: 'asc' } } },
          },
          topicModes: { orderBy: { modeNo: 'asc' } },
        }
      : { grades: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  });

  return NextResponse.json({ subjects });
}

// POST /api/subjects
// Body: { name, color, icon, assessmentType, displayStrategy, category, finalStrategy?, sortOrder? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon, assessmentType, displayStrategy, category, finalStrategy, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'نام درس الزامی است' }, { status: 400 });
    }

    const existing = await db.subject.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: 'درسی با این نام قبلاً ثبت شده است' }, { status: 409 });
    }

    const subject = await db.subject.create({
      data: {
        name,
        color: color || '#3EB489',
        icon: icon || null,
        assessmentType: assessmentType || 'کنکور',
        displayStrategy: displayStrategy || 'both',
        category: category || 'اختصاصی',
        finalStrategy: finalStrategy || 'default',
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('POST /api/subjects error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد درس' }, { status: 500 });
  }
}
