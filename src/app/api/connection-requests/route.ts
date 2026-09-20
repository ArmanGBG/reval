import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

// Compose a display `name` from the new firstName/lastName split. Returned on
// the connection-request payload so legacy clients (which read `.student.name`
// or `.advisor.name`) keep working without changes.
function withDisplayName<T extends { firstName: string; lastName: string | null }>(user: T) {
  return {
    ...user,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
  };
}

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['STUDENT', 'ADVISOR']);
  if (error || !ctx) return error;
  const where = ctx.user.role === 'STUDENT' ? { studentId: ctx.userId } : { advisorId: ctx.userId };
  const requests = await db.connectionRequest.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatar: true, publicCode: true, grade: true, major: true } },
      advisor: { select: { id: true, firstName: true, lastName: true, avatar: true, publicCode: true } },
    },
  });
  const self = await db.user.findUnique({
    where: { id: ctx.userId },
    select: {
      publicCode: true,
      assignedAdvisor: { select: { id: true, firstName: true, lastName: true, avatar: true, publicCode: true } },
    },
  });
  const serializedRequests = requests.map((r) => ({
    ...r,
    student: withDisplayName(r.student),
    advisor: withDisplayName(r.advisor),
  }));
  const serializedAdvisor = self?.assignedAdvisor ? withDisplayName(self.assignedAdvisor) : null;
  return NextResponse.json({ requests: serializedRequests, publicCode: self?.publicCode, assignedAdvisor: serializedAdvisor });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['STUDENT', 'ADVISOR']);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code) return NextResponse.json({ error: 'کد کاربر الزامی است' }, { status: 400 });
    const target = await db.user.findUnique({ where: { publicCode: code }, select: { id: true, role: true, isActive: true } });
    if (!target || !target.isActive || target.role === ctx.user.role || !['STUDENT', 'ADVISOR'].includes(target.role)) {
      return NextResponse.json({ error: 'کد کاربر معتبر نیست' }, { status: 404 });
    }
    const studentId = ctx.user.role === 'STUDENT' ? ctx.userId : target.id;
    const advisorId = ctx.user.role === 'ADVISOR' ? ctx.userId : target.id;
    if (studentId === advisorId) return NextResponse.json({ error: 'کد خودتان قابل استفاده نیست' }, { status: 400 });
    const student = await db.user.findUnique({ where: { id: studentId }, select: { assignedAdvisorId: true } });
    if (student?.assignedAdvisorId) return NextResponse.json({ error: 'دانش‌آموز در حال حاضر مشاور دارد' }, { status: 409 });
    const connection = await db.connectionRequest.upsert({
      where: { studentId_advisorId: { studentId, advisorId } },
      create: { studentId, advisorId, initiatedBy: ctx.user.role, status: 'PENDING' },
      update: { initiatedBy: ctx.user.role, status: 'PENDING', respondedAt: null },
      include: { student: { select: { id: true, firstName: true, lastName: true, avatar: true } }, advisor: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });
    return NextResponse.json({ request: { ...connection, student: withDisplayName(connection.student), advisor: withDisplayName(connection.advisor) } }, { status: 201 });
  } catch (err) {
    console.error('Connection request error:', err);
    return NextResponse.json({ error: 'ثبت درخواست انجام نشد' }, { status: 500 });
  }
}
