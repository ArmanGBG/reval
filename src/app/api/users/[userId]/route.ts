import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { detachAdvisorRoster, detachStudent } from '@/lib/user-lifecycle';
import { createPublicCode } from '@/lib/public-code';
import { computeEngagement } from '@/lib/user-engagement';

const roleMap = { STUDENT: 'student', ADVISOR: 'advisor', INSTITUTE_MANAGER: 'institute_manager' } as const;

// Trend window for the detail page — 30 days for a month-long view.
const DETAIL_TREND_DAYS = 30;

function serializeUser(user: Awaited<ReturnType<typeof loadUser>>) {
  if (!user) return null;
  const sourceTasks = user.role === 'ADVISOR' ? user.students.flatMap((student) => student.tasks) : user.tasks;
  const reportable = sourceTasks.filter((task) => task.status !== 'DRAFT');
  const completed = reportable.filter((task) => task.status === 'COMPLETED');
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const engagement = computeEngagement(sourceTasks, DETAIL_TREND_DAYS);
  return {
    id: user.id, name: fullName, firstName: user.firstName, lastName: user.lastName,
    avatar: user.avatar, phone: user.phone,
    role: roleMap[user.role as keyof typeof roleMap] ?? 'student',
    grade: user.grade, major: user.major, assignedAdvisorId: user.assignedAdvisorId,
    province: user.province, city: user.city,
    instituteId: user.instituteId, instituteName: user.institute?.name ?? 'بدون آموزشگاه',
    status: user.isActive ? 'active' : 'suspended',
    completionRate: reportable.length ? Math.round((completed.length / reportable.length) * 100) : 0,
    studyHours: Math.round((completed.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0) / 60) * 10) / 10,
    joinDate: user.createdAt.toISOString().split('T')[0],
    // Engagement fields (new) — 30-day trend for the detail page chart
    totalTasks: engagement.totalTasks,
    completedTasks: engagement.completedTasks,
    lastTaskInteraction: engagement.lastTaskInteraction,
    activityTrend: engagement.activityTrend,
  };
}

function loadUser(id: string) {
  return db.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      institute: { select: { name: true } },
      tasks: { select: { status: true, actualTimeMinutes: true, date: true, updatedAt: true } },
      students: { where: { deletedAt: null }, select: { tasks: { select: { status: true, actualTimeMinutes: true, date: true, updatedAt: true } } } },
      managedInstitute: { select: { id: true, deletedAt: true } },
    },
  });
}

// ===== GET /api/users/[userId] =====
// Returns a single user with full engagement data (30-day activity trend).
// Used by the super-admin User Detail page's Consistency Analysis section.
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId } = await params;
  const user = await loadUser(userId);
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  const serialized = serializeUser(user);
  if (!serialized) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  return NextResponse.json({ user: serialized });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId } = await params;
  const body = await request.json();
  const existing = await loadUser(userId);
  if (!existing) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  if (existing.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'ویرایش سوپرادمین از این مسیر مجاز نیست' }, { status: 403 });

  const requestedRole = body.role === 'student' ? 'STUDENT' : body.role === 'advisor' ? 'ADVISOR' : undefined;
  if ('role' in body && !requestedRole) return NextResponse.json({ error: 'نقش انتخاب‌شده معتبر نیست' }, { status: 400 });
  if (existing.role === 'INSTITUTE_MANAGER' && requestedRole) {
    return NextResponse.json({ error: 'نقش مدیر آموزشگاه فقط از بخش آموزشگاه قابل تغییر است' }, { status: 409 });
  }
  const nextInstituteId = 'instituteId' in body ? (body.instituteId || null) : existing.instituteId;
  if (nextInstituteId) {
    const institute = await db.institute.findFirst({ where: { id: nextInstituteId, deletedAt: null }, select: { id: true } });
    if (!institute) return NextResponse.json({ error: 'آموزشگاه معتبر نیست' }, { status: 400 });
  }
  const nextRole = requestedRole ?? existing.role;
  const nextPublicCode = requestedRole && requestedRole !== existing.role
    ? await createPublicCode(requestedRole === 'ADVISOR' ? 'ADV' : 'STU')
    : undefined;
  const grade = typeof body.grade === 'string' ? body.grade : existing.grade;
  const major = typeof body.major === 'string' ? body.major : existing.major;
  if (nextRole === 'STUDENT' && (!grade || !major)) {
    return NextResponse.json({ error: 'برای نقش دانش‌آموز، پایه و رشته الزامی است' }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    const roleChanged = nextRole !== existing.role;
    const instituteChanged = nextInstituteId !== existing.instituteId;
    const deactivating = body.status === 'suspended';
    if ((existing.role === 'ADVISOR' && (roleChanged || instituteChanged || deactivating))) await detachAdvisorRoster(tx, userId);
    if ((existing.role === 'STUDENT' && (roleChanged || instituteChanged || deactivating))) await detachStudent(tx, userId);
    // Compose firstName / lastName from either explicit new fields or a legacy
    // `name` field (split on first space). Only update if a non-empty value
    // is provided.
    const firstNameUpdate = typeof body.firstName === 'string' && body.firstName.trim() ? body.firstName.trim()
      : typeof body.name === 'string' && body.name.trim() ? body.name.trim().split(' ')[0] : undefined;
    const lastNameUpdate = typeof body.lastName === 'string' && body.lastName.trim() ? body.lastName.trim()
      : typeof body.name === 'string' && body.name.trim() && body.name.trim().includes(' ') ? body.name.trim().split(' ').slice(1).join(' ') : undefined;
    const provinceUpdate = typeof body.province === 'string' && body.province.trim() ? body.province.trim() : undefined;
    const cityUpdate = typeof body.city === 'string' && body.city.trim() ? body.city.trim() : undefined;
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(body.status === 'active' || body.status === 'suspended' ? { isActive: body.status === 'active' } : {}),
        ...(firstNameUpdate ? { firstName: firstNameUpdate } : {}),
        ...(lastNameUpdate !== undefined && lastNameUpdate !== null ? { lastName: lastNameUpdate } : {}),
        ...(typeof body.lastName === 'string' && body.lastName.trim() === '' ? { lastName: null } : {}),
        ...(provinceUpdate ? { province: provinceUpdate } : {}),
        ...(cityUpdate ? { city: cityUpdate } : {}),
        ...('instituteId' in body ? { instituteId: nextInstituteId } : {}),
        ...(requestedRole ? {
          role: requestedRole,
          publicCode: nextPublicCode,
          grade: requestedRole === 'STUDENT' ? grade : null,
          major: requestedRole === 'STUDENT' ? major : null,
          assignedAdvisorId: null,
        } : {}),
        ...(nextRole === 'STUDENT' ? { grade, major } : {}),
      },
    });
  });
  return NextResponse.json({ user: serializeUser(await loadUser(userId)) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const { userId } = await params;
  const user = await loadUser(userId);
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  if (user.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'حذف سوپرادمین مجاز نیست' }, { status: 400 });
  if (user.managedInstitute && !user.managedInstitute.deletedAt) {
    return NextResponse.json({ error: 'این کاربر مدیر یک آموزشگاه فعال است؛ ابتدا مدیر آموزشگاه را جایگزین کنید' }, { status: 409 });
  }
  await db.$transaction(async (tx) => {
    if (user.role === 'ADVISOR') await detachAdvisorRoster(tx, userId);
    if (user.role === 'STUDENT') await detachStudent(tx, userId);
    await tx.user.update({
      where: { id: userId },
      data: {
        phone: `deleted-${userId}-${Date.now()}`,
        password: null,
        phoneVerifiedAt: null,
        isActive: false,
        deletedAt: new Date(),
        assignedAdvisorId: null,
      },
    });
  });
  return NextResponse.json({ success: true });
}
