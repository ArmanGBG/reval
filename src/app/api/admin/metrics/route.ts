import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== GET /api/admin/metrics =====
// Returns real time-series analytics for the platform dashboard.
// Provides monthly counts for: new users, new institutes, new tasks,
// new exams, new messages — grouped by Persian-calendar month.
//
// Query params:
//   ?months=6 (default) → how many months of history to return
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const months = Math.min(parseInt(new URL(request.url).searchParams.get('months') || '6', 10), 12);

  // Build date range: last N months from now.
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Fetch raw counts grouped by month.
  const [users, institutes, tasks, exams, messages] = await Promise.all([
    db.user.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }).catch(() => []),
    db.institute.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }).catch(() => []),
    db.task.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }).catch(() => []),
    db.exam.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }).catch(() => []),
    db.message.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }).catch(() => []),
  ]);

  // Build month buckets.
  const monthBuckets: { label: string; key: string; users: number; institutes: number; tasks: number; exams: number; messages: number }[] = [];
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthIdx = d.getMonth();
    // Persian calendar month index approximation (Gregorian month - 3, wrapped).
    const persianMonthIdx = ((monthIdx - 3 + 12) % 12);
    monthBuckets.push({
      label: persianMonths[persianMonthIdx],
      key: `${d.getFullYear()}-${String(monthIdx + 1).padStart(2, '0')}`,
      users: 0,
      institutes: 0,
      tasks: 0,
      exams: 0,
      messages: 0,
    });
  }

  // Tally counts into month buckets.
  for (const [data, field] of [
    [users, 'users'],
    [institutes, 'institutes'],
    [tasks, 'tasks'],
    [exams, 'exams'],
    [messages, 'messages'],
  ] as const) {
    for (const row of data as any[]) {
      const date = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthBuckets.find((b) => b.key === key);
      if (bucket) (bucket as any)[field] += row._count;
    }
  }

  // Also return current snapshot counts.
  const [totalUsers, totalInstitutes, totalStudents, totalAdvisors, totalTasks, totalExams] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.institute.count(),
    db.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
    db.user.count({ where: { role: 'ADVISOR', deletedAt: null } }),
    db.task.count(),
    db.exam.count(),
  ]);

  return NextResponse.json({
    months: monthBuckets,
    snapshot: {
      totalUsers,
      totalInstitutes,
      totalStudents,
      totalAdvisors,
      totalTasks,
      totalExams,
    },
  });
}
