import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';
import { computeEngagement } from '@/lib/user-engagement';

const roleMap = {
  STUDENT: 'student',
  ADVISOR: 'advisor',
  INSTITUTE_MANAGER: 'institute_manager',
} as const;

const LIST_TREND_DAYS = 14;

interface RawUser {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string;
  phone: string;
  role: string;
  instituteId: string | null;
  grade: string | null;
  major: string | null;
  assignedAdvisorId: string | null;
  province: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  institute: { name: string } | null;
  tasks: Array<{ status: string; actualTimeMinutes: number | null; date: string; updatedAt: Date }>;
  students?: Array<{ tasks: Array<{ status: string; actualTimeMinutes: number | null; date: string; updatedAt: Date }> }>;
}

function serializeUser(user: RawUser) {
  const sourceTasks = user.role === 'ADVISOR' ? (user.students ?? []).flatMap((student) => student.tasks) : user.tasks;
  const reportable = sourceTasks.filter((task) => task.status !== 'DRAFT');
  const completed = reportable.filter((task) => task.status === 'COMPLETED');
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const engagement = computeEngagement(sourceTasks, LIST_TREND_DAYS);

  const consistencyRate = reportable.length
    ? Math.round((completed.length / reportable.length) * 100)
    : 0;

  return {
    id: user.id,
    name: fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    phone: user.phone,
    role: roleMap[user.role as keyof typeof roleMap] ?? 'student',
    grade: user.grade,
    major: user.major,
    assignedAdvisorId: user.assignedAdvisorId,
    instituteId: user.instituteId,
    instituteName: user.institute?.name ?? 'بدون آموزشگاه',
    province: user.province,
    city: user.city,
    status: user.isActive ? 'active' : 'suspended',
    completionRate: consistencyRate,
    consistencyRate,
    studyHours: Math.round((completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0) / 60) * 10) / 10,
    joinDate: user.createdAt.toISOString().split('T')[0],
    createdAt: user.createdAt.toISOString(),
    totalTasks: engagement.totalTasks,
    completedTasks: engagement.completedTasks,
    lastTaskInteraction: engagement.lastTaskInteraction,
    activityTrend: engagement.activityTrend,
  };
}

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  phone: true,
  role: true,
  grade: true,
  major: true,
  province: true,
  city: true,
  assignedAdvisorId: true,
  instituteId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  institute: { select: { name: true } },
  tasks: { select: { status: true, actualTimeMinutes: true, date: true, updatedAt: true } },
  students: { select: { tasks: { select: { status: true, actualTimeMinutes: true, date: true, updatedAt: true } } } },
} as const;

// ===== GET /api/admin/users =====
// Supports advanced sorting: ?sortBy=createdAt|alphabetical|totalTasks|consistencyRate&order=asc|desc
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = (searchParams.get('order') || 'desc').toLowerCase();
  const requestedRole = searchParams.get('role');
  const role =
    requestedRole === 'STUDENT' || requestedRole === 'ADVISOR' || requestedRole === 'INSTITUTE_MANAGER'
      ? requestedRole
      : undefined;
  const search = searchParams.get('search')?.trim();
  const instituteId = searchParams.get('instituteId');
  const status = searchParams.get('status');

  const users = await db.user.findMany({
    where: {
      deletedAt: null,
      role: role ?? { in: ['STUDENT', 'ADVISOR', 'INSTITUTE_MANAGER'] },
      ...(instituteId && instituteId !== 'all' ? { instituteId } : {}),
      ...(status === 'active' ? { isActive: true } : status === 'suspended' ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { province: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: userSelect,
  });

  const serialized = users.map((u) => serializeUser(u as unknown as RawUser));

  // Sort results
  const isAsc = order === 'asc';
  serialized.sort((a, b) => {
    if (sortBy === 'alphabetical' || sortBy === 'name') {
      const cmp = a.name.localeCompare(b.name, 'fa');
      return isAsc ? cmp : -cmp;
    }
    if (sortBy === 'totalTasks') {
      const diff = (a.totalTasks ?? 0) - (b.totalTasks ?? 0);
      return isAsc ? diff : -diff;
    }
    if (sortBy === 'consistencyRate') {
      const diff = (a.consistencyRate ?? 0) - (b.consistencyRate ?? 0);
      return isAsc ? diff : -diff;
    }
    // Default: createdAt
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return isAsc ? timeA - timeB : timeB - timeA;
  });

  return NextResponse.json({ users: serialized });
}

// ===== POST /api/admin/users =====
export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;

  const body = await request.json();
  const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
  const firstName =
    typeof body.firstName === 'string'
      ? body.firstName.trim()
      : typeof body.name === 'string'
        ? body.name.trim().split(' ')[0]
        : '';
  const lastName =
    typeof body.lastName === 'string' && body.lastName.trim()
      ? body.lastName.trim()
      : typeof body.name === 'string' && body.name.trim().includes(' ')
        ? body.name.trim().split(' ').slice(1).join(' ')
        : null;
  const role = body.role === 'advisor' ? 'ADVISOR' : body.role === 'student' ? 'STUDENT' : null;

  if (!role) return NextResponse.json({ error: 'نقش معتبر نیست' }, { status: 400 });
  if (!phone || !firstName) return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });

  if (await db.user.findUnique({ where: { phone }, select: { id: true } })) {
    return NextResponse.json({ error: 'این شماره قبلاً ثبت شده است' }, { status: 409 });
  }

  const grade = typeof body.grade === 'string' ? body.grade : null;
  const major = typeof body.major === 'string' ? body.major : null;
  const province = typeof body.province === 'string' && body.province.trim() ? body.province.trim() : null;
  const city = typeof body.city === 'string' && body.city.trim() ? body.city.trim() : null;

  if (role === 'STUDENT' && (!grade || !major)) {
    return NextResponse.json({ error: 'پایه و رشته دانش‌آموز الزامی است' }, { status: 400 });
  }

  const instituteId = body.instituteId || null;
  if (instituteId && !(await db.institute.findFirst({ where: { id: instituteId, deletedAt: null }, select: { id: true } }))) {
    return NextResponse.json({ error: 'آموزشگاه معتبر نیست' }, { status: 400 });
  }

  const user = await db.user.create({
    data: {
      phone,
      firstName,
      lastName,
      role,
      grade,
      major,
      province,
      city,
      instituteId,
      publicCode: await createPublicCode(role === 'ADVISOR' ? 'ADV' : 'STU'),
      isActive: true,
    },
    select: userSelect,
  });

  return NextResponse.json({ user: serializeUser(user as unknown as RawUser) }, { status: 201 });
}
