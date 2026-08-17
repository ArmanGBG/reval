import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ instituteId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']); if (error || !ctx) return error;
  const { instituteId } = await params; const body = await request.json(); const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (['free', 'basic', 'pro', 'enterprise'].includes(body.subscriptionPlan)) data.subscriptionPlan = body.subscriptionPlan;
  if (['active', 'suspended', 'trial'].includes(body.status)) data.status = body.status;
  await db.institute.update({ where: { id: instituteId }, data });
  const institute = await db.institute.findUnique({ where: { id: instituteId }, include: { manager: true, members: { where: { deletedAt: null }, select: { role: true, tasks: { select: { status: true } } } } } });
  if (!institute) return NextResponse.json({ error: 'آموزشگاه یافت نشد' }, { status: 404 });
  const tasks = institute.members.flatMap((member) => member.tasks).filter((task) => task.status !== 'DRAFT'); const completed = tasks.filter((task) => task.status === 'COMPLETED');
  return NextResponse.json({ institute: { id: institute.id, name: institute.name, logoUrl: institute.logoUrl, managerName: institute.manager.name, managerPhone: institute.manager.phone, subscriptionPlan: institute.subscriptionPlan, status: institute.status, studentCount: institute.members.filter((member) => member.role === 'STUDENT').length, advisorCount: institute.members.filter((member) => member.role === 'ADVISOR').length, createdAt: institute.createdAt.toISOString().split('T')[0], avgCompletionRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0 } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ instituteId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { instituteId } = await params;
  const institute = await db.institute.findUnique({ where: { id: instituteId }, select: { id: true, managerId: true } });
  if (!institute) return NextResponse.json({ error: 'آموزشگاه یافت نشد' }, { status: 404 });
  await db.$transaction(async (tx) => {
    const members = await tx.user.findMany({ where: { instituteId }, select: { id: true } });
    const memberIds = members.map((member) => member.id);
    await tx.user.updateMany({ where: { assignedAdvisorId: { in: memberIds } }, data: { assignedAdvisorId: null } });
    await tx.connectionRequest.updateMany({
      where: { OR: [{ studentId: { in: memberIds } }, { advisorId: { in: memberIds } }], status: { in: ['PENDING', 'ACCEPTED'] } },
      data: { status: 'ENDED', respondedAt: new Date() },
    });
    await tx.user.updateMany({ where: { instituteId }, data: { instituteId: null, assignedAdvisorId: null } });
    await tx.user.update({
      where: { id: institute.managerId },
      data: {
        phone: `deleted-${institute.managerId}-${Date.now()}`,
        password: null,
        phoneVerifiedAt: null,
        isActive: false,
        deletedAt: new Date(),
        instituteId: null,
      },
    });
    await tx.institute.update({ where: { id: instituteId }, data: { deletedAt: new Date(), status: 'suspended' } });
  });
  return NextResponse.json({ success: true });
}
