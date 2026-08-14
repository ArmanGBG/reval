import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

const VALID_GRADES = ['دهم', 'یازدهم', 'دوازدهم'];
const VALID_MAJORS = ['تجربی', 'ریاضی', 'انسانی'];

// GET /api/subjects/:subjectId/grades
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { subjectId } = await params;
  const subject = await db.subject.findFirst({ where: { id: subjectId, isActive: true }, select: { id: true } });
  if (!subject) return NextResponse.json({ error: 'درس یافت نشد' }, { status: 404 });
  const grades = await db.gradeSubject.findMany({
    where: { subjectId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json({ grades });
}

// POST /api/subjects/:subjectId/grades
// Body: { grade, major, sortOrder?, isKonkur?, isFinal? }
// Validates grade ∈ {دهم, یازدهم, دوازدهم} and major ∈ {تجربی, ریاضی, انسانی}.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { subjectId } = await params;
  try {
    const body = await request.json();
    const { grade, major, sortOrder, isKonkur, isFinal } = body;
    if (!grade || !major) {
      return NextResponse.json(
        { error: 'پایه و رشته الزامی است' },
        { status: 400 },
      );
    }
    if (!VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        { error: `پایه باید یکی از مقادیر ${VALID_GRADES.join('، ')} باشد` },
        { status: 400 },
      );
    }
    if (!VALID_MAJORS.includes(major)) {
      return NextResponse.json(
        { error: `رشته باید یکی از مقادیر ${VALID_MAJORS.join('، ')} باشد` },
        { status: 400 },
      );
    }
    if (typeof isKonkur !== 'boolean' || typeof isFinal !== 'boolean') {
      return NextResponse.json({ error: 'isKonkur و isFinal باید boolean باشند' }, { status: 400 });
    }
    if (!isKonkur && !isFinal) {
      return NextResponse.json({ error: 'حداقل یکی از وضعیت‌های کنکور یا نهایی باید فعال باشد' }, { status: 400 });
    }
    if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) {
      return NextResponse.json({ error: 'ترتیب باید عدد صحیح نامنفی باشد' }, { status: 400 });
    }

    // Verify subject exists
    const subject = await db.subject.findFirst({ where: { id: subjectId, isActive: true } });
    if (!subject) {
      return NextResponse.json({ error: 'درس یافت نشد' }, { status: 404 });
    }

    // Check for existing GradeSubject (active OR inactive) with same grade+major
    const existing = await db.gradeSubject.findUnique({
      where: { subjectId_grade_major: { subjectId, grade, major } },
    });
    if (existing) {
      if (existing.isActive) {
        // Active duplicate — real conflict
        return NextResponse.json(
          { error: 'این پایه و رشته قبلاً ثبت شده' },
          { status: 409 },
        );
      }
      // Inactive (soft-deleted) — reactivate it
      const reactivated = await db.gradeSubject.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : existing.sortOrder,
          isKonkur,
          isFinal,
        },
      });
      return NextResponse.json({ gradeSubject: reactivated, reactivated: true });
    }

    const gradeSubject = await db.gradeSubject.create({
      data: {
        subjectId,
        grade,
        major,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isKonkur,
        isFinal,
      },
    });
    return NextResponse.json({ gradeSubject }, { status: 201 });
  } catch (error) {
    console.error('POST grade-subject error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد پایه برای درس' },
      { status: 500 },
    );
  }
}
