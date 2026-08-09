import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.status === 'active' || body.status === 'suspended') data.isActive = body.status === 'active';
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if ('instituteId' in body) data.instituteId = body.instituteId || null;
  const existing = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  const user = await db.user.update({ where: { id: userId }, data, include: { institute: { select: { name: true } }, tasks: { select: { status: true, actualTimeMinutes: true } }, students: { where: { deletedAt: null }, select: { tasks: { select: { status: true, actualTimeMinutes: true } } } } } });
  const sourceTasks = user.role === 'ADVISOR' ? user.students.flatMap((student) => student.tasks) : user.tasks;
  const reportable = sourceTasks.filter((task) => task.status !== 'DRAFT');
  const completed = reportable.filter((task) => task.status === 'COMPLETED');
  return NextResponse.json({ user: { id: user.id, name: user.name, avatar: user.avatar, phone: user.phone, role: user.role === 'ADVISOR' ? 'advisor' : user.role === 'INSTITUTE_MANAGER' ? 'institute_manager' : 'student', instituteId: user.instituteId, instituteName: user.institute?.name ?? 'بدون آموزشگاه', status: user.isActive ? 'active' : 'suspended', completionRate: reportable.length ? Math.round((completed.length / reportable.length) * 100) : 0, studyHours: Math.round((completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0) / 60) * 10) / 10, joinDate: user.createdAt.toISOString().split('T')[0] } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId } = await params;
  const user = await db.user.findFirst({ where: { id: userId, deletedAt: null }, select: { role: true } });
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  if (user.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'حذف سوپرادمین مجاز نیست' }, { status: 400 });
  await db.user.update({ where: { id: userId }, data: { isActive: false, deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
