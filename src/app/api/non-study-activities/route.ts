import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';
import { isNonStudyCategoryKey } from '@/lib/non-study-activity';

// =================================================================
// /api/non-study-activities
//
// GET  ?studentId=xxx[&date=YYYY-MM-DD | &startDate=..&endDate=..]
//      → activities for a student (self, assigned advisor, institute
//        manager, or super admin — same visibility as tasks)
//
// POST { studentId, category, durationMinutes?, date }
//      → students log their own activities only.
//        durationMinutes is fully optional (null = not specified).
// =================================================================

function parseActivity(activity: { id: string; studentId: string; category: string; durationMinutes: number | null; date: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: activity.id,
    studentId: activity.studentId,
    category: activity.category,
    durationMinutes: activity.durationMinutes,
    date: activity.date,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  const params = new URL(request.url).searchParams;
  const studentId = params.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId الزامی است' }, { status: 400 });
  if (!(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'دسترسی به فعالیت‌های این دانش‌آموز مجاز نیست' }, { status: 403 });
  }
  const where: Record<string, unknown> = { studentId };
  const [date, startDate, endDate] = [params.get('date'), params.get('startDate'), params.get('endDate')];
  if (date) where.date = date;
  else if (startDate || endDate) where.date = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) };
  const activities = await db.nonStudyActivity.findMany({ where, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ activities: activities.map(parseActivity) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    // Students log their own activities; their assigned advisor can log on
    // their behalf with the same rules (same visibility check as tasks).
    const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === body.studentId;
    const isManagingAdvisor = ctx.user.role === 'ADVISOR' && typeof body.studentId === 'string'
      && (await canViewStudentTasks(ctx, body.studentId));
    if (!isSelf && !isManagingAdvisor) {
      return NextResponse.json({ error: 'اجازه ثبت فعالیت غیردرسی برای این دانش‌آموز را ندارید' }, { status: 403 });
    }
    if (!isNonStudyCategoryKey(body.category)) {
      return NextResponse.json({ error: 'دسته‌بندی فعالیت معتبر نیست' }, { status: 400 });
    }
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'تاریخ معتبر الزامی است' }, { status: 400 });
    }
    if (body.durationMinutes != null && (typeof body.durationMinutes !== 'number' || !Number.isFinite(body.durationMinutes) || body.durationMinutes < 0)) {
      return NextResponse.json({ error: 'مدت زمان باید عدد نامنفی یا خالی باشد' }, { status: 400 });
    }
    const activity = await db.nonStudyActivity.create({
      data: {
        studentId: body.studentId,
        category: body.category,
        durationMinutes: body.durationMinutes ?? null,
        date: body.date,
      },
    });
    return NextResponse.json({ activity: parseActivity(activity) }, { status: 201 });
  } catch (cause) {
    console.error('POST /api/non-study-activities error:', cause);
    return NextResponse.json({ error: 'خطا در ثبت فعالیت غیردرسی' }, { status: 500 });
  }
}
