import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  // 1. Fetch all advisors with their students and connection requests
  const advisors = await db.user.findMany({
    where: { role: 'ADVISOR', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      publicCode: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      students: {
        where: { deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          grade: true,
          major: true,
          province: true,
          city: true,
          createdAt: true,
          updatedAt: true,
          tasks: {
            select: { status: true },
          },
        },
      },
      receivedConnectionRequests: {
        select: {
          id: true,
          studentId: true,
          status: true,
          createdAt: true,
          respondedAt: true,
        },
      },
    },
  });

  // 2. Fetch unassigned students for the "Assign New Student" sheet feature
  const unassignedStudents = await db.user.findMany({
    where: {
      role: 'STUDENT',
      assignedAdvisorId: null,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
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

  const formattedAdvisors = advisors.map((adv) => {
    const fullName = [adv.firstName, adv.lastName].filter(Boolean).join(' ').trim();

    const connectedStudents = adv.students.map((student) => {
      const studentName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
      const reportable = student.tasks.filter((t) => t.status !== 'DRAFT');
      const completed = reportable.filter((t) => t.status === 'COMPLETED');
      const consistencyRate = reportable.length
        ? Math.round((completed.length / reportable.length) * 100)
        : 0;

      // Find accepted connection request
      const conn = adv.receivedConnectionRequests.find(
        (r) => r.studentId === student.id && r.status === 'ACCEPTED',
      );

      const connectedAt = (conn?.respondedAt || conn?.createdAt || student.createdAt).toISOString();

      return {
        id: student.id,
        name: studentName,
        firstName: student.firstName,
        lastName: student.lastName,
        avatar: student.avatar,
        phone: student.phone,
        grade: student.grade,
        major: student.major,
        province: student.province,
        city: student.city,
        consistencyRate,
        connectedAt,
        connectionRequestId: conn?.id || null,
      };
    });

    const totalStudentsAssigned = connectedStudents.length;
    const averageStudentConsistency = totalStudentsAssigned > 0
      ? Math.round(
          connectedStudents.reduce((sum, s) => sum + s.consistencyRate, 0) / totalStudentsAssigned,
        )
      : 0;

    return {
      id: adv.id,
      name: fullName,
      firstName: adv.firstName,
      lastName: adv.lastName,
      avatar: adv.avatar,
      phone: adv.phone,
      publicCode: adv.publicCode,
      role: adv.role,
      isActive: adv.isActive,
      status: adv.isActive ? 'active' : 'suspended',
      createdAt: adv.createdAt.toISOString(),
      updatedAt: adv.updatedAt.toISOString(),
      lastActive: adv.updatedAt.toISOString(),
      totalStudentsAssigned,
      averageStudentConsistency,
      connectedStudents,
    };
  });

  const formattedUnassigned = unassignedStudents.map((st) => ({
    ...st,
    name: [st.firstName, st.lastName].filter(Boolean).join(' ').trim(),
  }));

  return NextResponse.json({
    advisors: formattedAdvisors,
    unassignedStudents: formattedUnassigned,
  });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    const firstName =
      typeof body.firstName === 'string'
        ? body.firstName.trim()
        : typeof body.name === 'string' && body.name.trim()
          ? body.name.trim().split(' ')[0]
          : '';
    const lastName =
      typeof body.lastName === 'string' && body.lastName.trim()
        ? body.lastName.trim()
        : typeof body.name === 'string' && body.name.trim().includes(' ')
          ? body.name.trim().split(' ').slice(1).join(' ')
          : null;

    if (!phone || !firstName) {
      return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'این شماره قبلاً در سیستم ثبت شده است' }, { status: 409 });
    }

    const advisor = await db.user.create({
      data: {
        phone,
        firstName,
        lastName,
        avatar: typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊',
        role: 'ADVISOR',
        publicCode: await createPublicCode('ADV'),
        password: null,
        isActive: true,
        phoneVerifiedAt: null,
      },
    });

    const fullName = [advisor.firstName, advisor.lastName].filter(Boolean).join(' ').trim();

    return NextResponse.json(
      {
        advisor: {
          ...advisor,
          name: fullName,
          totalStudentsAssigned: 0,
          averageStudentConsistency: 0,
          connectedStudents: [],
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('Advisor creation error:', err);
    return NextResponse.json({ error: 'ساخت حساب مشاور انجام نشد' }, { status: 500 });
  }
}
