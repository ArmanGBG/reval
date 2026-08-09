import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';

function serialize(institute: Awaited<ReturnType<typeof getInstitute>>) {
  if (!institute) return null;
  const tasks = institute.members.flatMap((member) => member.tasks).filter((task) => task.status !== 'DRAFT');
  const completed = tasks.filter((task) => task.status === 'COMPLETED');
  return { id: institute.id, name: institute.name, logoUrl: institute.logoUrl, managerName: institute.manager.name, managerPhone: institute.manager.phone, subscriptionPlan: institute.subscriptionPlan, status: institute.status, studentCount: institute.members.filter((member) => member.role === 'STUDENT').length, advisorCount: institute.members.filter((member) => member.role === 'ADVISOR').length, createdAt: institute.createdAt.toISOString().split('T')[0], avgCompletionRate: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0 };
}

function getInstitute(id: string) { return db.institute.findUnique({ where: { id }, include: { manager: true, members: { where: { deletedAt: null }, select: { role: true, tasks: { select: { status: true } } } } } }); }

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']); if (error || !ctx) return error;
  const institutes = await db.institute.findMany({ where: { deletedAt: null }, include: { manager: true, members: { where: { deletedAt: null }, select: { role: true, tasks: { select: { status: true } } } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ institutes: institutes.map((item) => serialize(item)) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']); if (error || !ctx) return error;
  const body = await request.json(); const name = typeof body.name === 'string' ? body.name.trim() : ''; const managerName = typeof body.managerName === 'string' ? body.managerName.trim() : ''; const phone = normalizeIranianPhone(typeof body.managerPhone === 'string' ? body.managerPhone : '');
  if (!name || !managerName || !phone) return NextResponse.json({ error: 'نام آموزشگاه، مدیر و شماره موبایل الزامی است' }, { status: 400 });
  if (await db.user.findUnique({ where: { phone }, select: { id: true } })) return NextResponse.json({ error: 'شماره مدیر قبلاً ثبت شده است' }, { status: 409 });
  const institute = await db.$transaction(async (tx) => { const manager = await tx.user.create({ data: { name: managerName, phone, role: 'INSTITUTE_MANAGER', publicCode: await createPublicCode('MGR') } }); const created = await tx.institute.create({ data: { name, managerId: manager.id, subscriptionPlan: body.subscriptionPlan || 'basic', status: body.status || 'trial' } }); await tx.user.update({ where: { id: manager.id }, data: { instituteId: created.id } }); return created; });
  return NextResponse.json({ institute: serialize(await getInstitute(institute.id)) }, { status: 201 });
}
