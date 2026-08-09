import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['STUDENT', 'ADVISOR']);
  if (error || !ctx) return error;
  const where = ctx.user.role === 'STUDENT' ? { studentId: ctx.userId } : { advisorId: ctx.userId };
  const requests = await db.connectionRequest.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      student: { select: { id: true, name: true, avatar: true, publicCode: true, grade: true, major: true } },
      advisor: { select: { id: true, name: true, avatar: true, publicCode: true } },
    },
  });
  const self = await db.user.findUnique({
    where: { id: ctx.userId },
    select: {
      publicCode: true,
      assignedAdvisor: { select: { id: true, name: true, avatar: true, publicCode: true } },
    },
  });
  return NextResponse.json({ requests, publicCode: self?.publicCode, assignedAdvisor: self?.assignedAdvisor || null });
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
      include: { student: { select: { id: true, name: true, avatar: true } }, advisor: { select: { id: true, name: true, avatar: true } } },
    });
    return NextResponse.json({ request: connection }, { status: 201 });
  } catch (error) {
    console.error('Connection request error:', error);
    return NextResponse.json({ error: 'ثبت درخواست انجام نشد' }, { status: 500 });
  }
}
