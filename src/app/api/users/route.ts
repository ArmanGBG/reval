import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';

const roleMap = { STUDENT: 'student', ADVISOR: 'advisor', INSTITUTE_MANAGER: 'institute_manager' } as const;

function serializeUser(user: {
  id: string; name: string; avatar: string; phone: string; role: string; instituteId: string | null; grade: string | null; major: string | null; assignedAdvisorId: string | null;
  isActive: boolean; createdAt: Date; institute: { name: string } | null;
  tasks: Array<{ status: string; actualTimeMinutes: number | null }>;
  students?: Array<{ tasks: Array<{ status: string; actualTimeMinutes: number | null }> }>;
}) {
  const sourceTasks = user.role === 'ADVISOR' ? (user.students ?? []).flatMap((student) => student.tasks) : user.tasks;
  const reportable = sourceTasks.filter((task) => task.status !== 'DRAFT');
  const completed = reportable.filter((task) => task.status === 'COMPLETED');
  return {
    id: user.id, name: user.name, avatar: user.avatar, phone: user.phone,
    role: roleMap[user.role as keyof typeof roleMap] ?? 'student',
    grade: user.grade, major: user.major, assignedAdvisorId: user.assignedAdvisorId,
    instituteId: user.instituteId, instituteName: user.institute?.name ?? 'بدون آموزشگاه',
    status: user.isActive ? 'active' : 'suspended',
    completionRate: reportable.length ? Math.round((completed.length / reportable.length) * 100) : 0,
    studyHours: Math.round((completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0) / 60) * 10) / 10,
    joinDate: user.createdAt.toISOString().split('T')[0],
  };
}

const userSelect = {
  id: true,
  name: true,
  avatar: true,
  phone: true,
  role: true,
  grade: true,
  major: true,
  assignedAdvisorId: true,
  instituteId: true,
  isActive: true,
  createdAt: true,
  institute: { select: { name: true } },
  tasks: { select: { status: true, actualTimeMinutes: true } },
  students: { select: { tasks: { select: { status: true, actualTimeMinutes: true } } } },
} as const;

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const requestedRole = new URL(request.url).searchParams.get('role');
  const role = requestedRole === 'STUDENT' || requestedRole === 'ADVISOR' || requestedRole === 'INSTITUTE_MANAGER' ? requestedRole : undefined;
  const users = await db.user.findMany({ where: { deletedAt: null, role: role ?? { in: ['STUDENT', 'ADVISOR', 'INSTITUTE_MANAGER'] } }, orderBy: { createdAt: 'desc' }, select: userSelect });
  return NextResponse.json({ users: users.map(serializeUser) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const body = await request.json();
  const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = body.role === 'advisor' ? 'ADVISOR' : body.role === 'student' ? 'STUDENT' : null;
  if (!role) return NextResponse.json({ error: 'نقش معتبر نیست' }, { status: 400 });
  if (!phone || !name) return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
  if (await db.user.findUnique({ where: { phone }, select: { id: true } })) return NextResponse.json({ error: 'این شماره قبلاً ثبت شده است' }, { status: 409 });
  const grade = typeof body.grade === 'string' ? body.grade : null;
  const major = typeof body.major === 'string' ? body.major : null;
  if (role === 'STUDENT' && (!grade || !major)) return NextResponse.json({ error: 'پایه و رشته دانش‌آموز الزامی است' }, { status: 400 });
  const instituteId = body.instituteId || null;
  if (instituteId && !(await db.institute.findFirst({ where: { id: instituteId, deletedAt: null }, select: { id: true } }))) {
    return NextResponse.json({ error: 'آموزشگاه معتبر نیست' }, { status: 400 });
  }
  const user = await db.user.create({ data: { phone, name, role, grade, major, instituteId, publicCode: await createPublicCode(role === 'ADVISOR' ? 'ADV' : 'STU'), isActive: true }, select: userSelect });
  return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
}
