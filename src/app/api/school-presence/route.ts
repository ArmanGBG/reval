import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';
import { isValidTimeString, calculateSchoolDurationMinutes } from '@/lib/school-presence';

function parseRecord(record: {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    userId: record.userId,
    date: record.date,
    startTime: record.startTime,
    endTime: record.endTime,
    durationMinutes: record.durationMinutes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId') || url.searchParams.get('userId');
  if (!studentId) {
    return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
  }

  if (!(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const where: Record<string, unknown> = { userId: studentId };
  if (startDate || endDate) {
    where.date = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  try {
    const records = await db.schoolPresence.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ schoolPresences: records.map(parseRecord) });
  } catch (getErr) {
    console.error('[GET /api/school-presence error]:', getErr);
    const message = getErr instanceof Error ? getErr.message : 'خطای سرور در دریافت ساعات مدرسه';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  try {
    const body = await request.json();
    const targetUserId = body.userId || body.studentId;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === targetUserId;
    const isManagingAdvisor =
      ctx.user.role === 'ADVISOR' && (await canViewStudentTasks(ctx, targetUserId));

    if (!isSelf && !isManagingAdvisor && ctx.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'اجازه ثبت اطلاعات برای این کاربر را ندارید' }, { status: 403 });
    }

    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'تاریخ معتبر الزامی است' }, { status: 400 });
    }

    if (!isValidTimeString(body.startTime)) {
      return NextResponse.json({ error: 'ساعت شروع معتبر نیست (HH:mm)' }, { status: 400 });
    }

    if (!isValidTimeString(body.endTime)) {
      return NextResponse.json({ error: 'ساعت پایان معتبر نیست (HH:mm)' }, { status: 400 });
    }

    const startTime = body.startTime.trim();
    const endTime = body.endTime.trim();
    const durationMinutes = calculateSchoolDurationMinutes(startTime, endTime);

    if (durationMinutes <= 0) {
      return NextResponse.json({ error: 'مدت زمان حضور در مدرسه باید بیشتر از صفر باشد' }, { status: 400 });
    }

    let record;
    try {
      record = await db.schoolPresence.upsert({
        where: {
          userId_date: {
            userId: targetUserId,
            date: body.date,
          },
        },
        update: {
          startTime,
          endTime,
          durationMinutes,
        },
        create: {
          userId: targetUserId,
          date: body.date,
          startTime,
          endTime,
          durationMinutes,
        },
      });
    } catch (prismaUpsertErr) {
      console.error('[POST /api/school-presence db.schoolPresence.upsert error]:', prismaUpsertErr);
      throw prismaUpsertErr;
    }

    return NextResponse.json({ schoolPresence: parseRecord(record) });
  } catch (err) {
    console.error('[POST /api/school-presence CRITICAL error]:', err);
    const message = err instanceof Error ? err.message : 'خطای سرور در ذخیره ساعت مدرسه';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'شناسه رکورد الزامی است' }, { status: 400 });
  }

  try {
    const existing = await db.schoolPresence.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'رکورد یافت نشد' }, { status: 404 });
    }

    const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === existing.userId;
    const isManagingAdvisor =
      ctx.user.role === 'ADVISOR' && (await canViewStudentTasks(ctx, existing.userId));

    if (!isSelf && !isManagingAdvisor && ctx.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'اجازه حذف این رکورد را ندارید' }, { status: 403 });
    }

    await db.schoolPresence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (deleteErr) {
    console.error('[DELETE /api/school-presence error]:', deleteErr);
    const message = deleteErr instanceof Error ? deleteErr.message : 'خطا در حذف رکورد مدرسه';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
