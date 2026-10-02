import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { assignAdvisor } from '@/lib/user-lifecycle';

// ===== POST /api/admin/advisors/[advisorId]/students =====
// Assigns a student to this advisor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ advisorId: string }> },
) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  const { advisorId } = await params;
  if (!advisorId) {
    return NextResponse.json({ error: 'شناسه مشاور الزامی است' }, { status: 400 });
  }

  const body = await request.json();
  const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
  if (!studentId) {
    return NextResponse.json({ error: 'شناسه دانش‌آموز الزامی است' }, { status: 400 });
  }

  try {
    await db.$transaction((tx) => assignAdvisor(tx, studentId, advisorId));

    // Fetch updated student info
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        grade: true,
        major: true,
      },
    });

    const conn = await db.connectionRequest.findUnique({
      where: {
        studentId_advisorId: { studentId, advisorId },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        respondedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      studentId,
      advisorId,
      student: student
        ? {
            ...student,
            name: [student.firstName, student.lastName].filter(Boolean).join(' ').trim(),
            consistencyRate: 0,
            connectedAt: (conn?.respondedAt || conn?.createdAt || new Date()).toISOString(),
            connectionRequestId: conn?.id || null,
          }
        : null,
    });
  } catch (assignmentError) {
    const message = assignmentError instanceof Error ? assignmentError.message : '';
    if (message === 'STUDENT_INVALID') {
      return NextResponse.json({ error: 'دانش‌آموز فعال یافت نشد' }, { status: 404 });
    }
    if (message === 'ADVISOR_INVALID') {
      return NextResponse.json({ error: 'مشاور فعال یافت نشد' }, { status: 404 });
    }
    if (message === 'INSTITUTE_MISMATCH') {
      return NextResponse.json(
        { error: 'دانش‌آموز و مشاور باید عضو یک آموزشگاه باشند یا هر دو بدون آموزشگاه باشند' },
        { status: 409 },
      );
    }
    console.error('Error assigning student:', assignmentError);
    return NextResponse.json({ error: 'خطا در تخصیص دانش‌آموز' }, { status: 500 });
  }
}
