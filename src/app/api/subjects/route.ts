import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { normalizeSubjectName } from '@/lib/validators/normalize';

// GET /api/subjects
// Optional query params:
//   ?grade=دهم&major=تجربی   → filter by GradeSubject
//   ?include=tree            → include grades → chapters → topics → topicModes → subtopics
//   ?isKonkur=true|false     → filter GradeSubject eligibility
//   ?isFinal=true|false      → filter GradeSubject eligibility
//
// Authorization: any authenticated user can view subjects (read-only).
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const major = searchParams.get('major');
  const includeTree = searchParams.get('include') === 'tree';
  const isKonkurParam = searchParams.get('isKonkur');
  const isFinalParam = searchParams.get('isFinal');

  if (isKonkurParam !== null && isKonkurParam !== 'true' && isKonkurParam !== 'false') {
    return NextResponse.json({ error: 'isKonkur باید true یا false باشد' }, { status: 400 });
  }
  if (isFinalParam !== null && isFinalParam !== 'true' && isFinalParam !== 'false') {
    return NextResponse.json({ error: 'isFinal باید true یا false باشد' }, { status: 400 });
  }

  const where: Record<string, unknown> = { isActive: true };
  const gradeEligibility = {
    ...(isKonkurParam === 'true' ? { isKonkur: true } : {}),
    ...(isKonkurParam === 'false' ? { isKonkur: false } : {}),
    ...(isFinalParam === 'true' ? { isFinal: true } : {}),
    ...(isFinalParam === 'false' ? { isFinal: false } : {}),
  };
  const gradeScope = {
    ...(grade ? { grade } : {}),
    ...(major ? { major } : {}),
    ...gradeEligibility,
  };
  if (grade || major || isKonkurParam !== null || isFinalParam !== null) {
    where.grades = {
      some: {
        isActive: true,
        ...gradeScope,
      },
    };
  }

  const subjects = await db.subject.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: includeTree
      ? {
          grades: {
            where: { isActive: true, ...gradeScope },
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
        }
      : {
          grades: { where: { isActive: true, ...gradeScope }, orderBy: { sortOrder: 'asc' } },
        },
  });

  return NextResponse.json({ subjects });
}

// POST /api/subjects
// Body: { name, color?, icon?, sortOrder? }
// Authorization: SUPER_ADMIN only.
//
// Reactivation behavior: if a subject with the same name exists but is
// inactive (soft-deleted), we reactivate it and update its properties
// instead of returning a 409 conflict. This prevents the "stuck" state
// where a deleted subject can't be recreated.
export async function POST(request: NextRequest) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, color, icon, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'نام درس الزامی است' }, { status: 400 });
    }
    if (color !== undefined && typeof color !== 'string') {
      return NextResponse.json({ error: 'رنگ درس باید متن باشد' }, { status: 400 });
    }
    if (icon !== undefined && icon !== null && typeof icon !== 'string') {
      return NextResponse.json({ error: 'آیکن درس باید متن یا null باشد' }, { status: 400 });
    }
    if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) {
      return NextResponse.json({ error: 'ترتیب درس باید عدد صحیح نامنفی باشد' }, { status: 400 });
    }

    // Normalize the name (Persian Yeh/Kaf, spaces, etc.) for deduplication.
    const normalizedName = normalizeSubjectName(name);
    if (!normalizedName) {
      return NextResponse.json(
        { error: 'نام درس پس از پردازش خالی است' },
        { status: 400 },
      );
    }

    // Check for existing subject by normalized name (active OR inactive).
    // We use normalizedName for dedup so "ریاضی" / "رياضي" / "ریاضی " are
    // treated as the same subject.
    const existing = await db.subject.findUnique({
      where: { normalizedName },
    });
    if (existing) {
      if (existing.isActive) {
        // Active duplicate — real conflict
        return NextResponse.json(
          { error: 'درسی فعال با این نام قبلاً ثبت شده است' },
          { status: 409 },
        );
      }
      // Inactive (soft-deleted) — reactivate with updated properties.
      // Also update the display name (keep it in sync with the latest input).
      const reactivated = await db.subject.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          name, // update display name to the latest input
          normalizedName,
          color: color || existing.color,
          icon: icon !== undefined ? icon : existing.icon,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : existing.sortOrder,
        },
      });
      return NextResponse.json({ subject: reactivated, reactivated: true });
    }

    const subject = await db.subject.create({
      data: {
        name,
        normalizedName,
        color: color || '#3EB489',
        icon: icon || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('POST /api/subjects error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد درس' }, { status: 500 });
  }
}
