import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, requireAuth } from '@/lib/api-auth';
import { isValidTimeString, nightSleepMinutes } from '@/lib/sleep';

// =================================================================
// /api/sleep
//
// GET  ?studentId=xxx → all sleep records for a student (self, assigned
//      advisor, or manager — same visibility as tasks).
//
// POST { studentId, type: 'NIGHT'|'NAP', date, startTime, ... }
//      NIGHT: { endTime } (duration derived, midnight crossing handled).
//      NAP:   { durationMinutes } (explicit, 1..480).
//      One record per (student, date, type) — upsert on re-submit.
// =================================================================

function parseRecord(record: { id: string; studentId: string; type: string; date: string; startTime: string; endTime: string | null; durationMinutes: number; createdAt: Date; updatedAt: Date }) {
  return {
    id: record.id,
    studentId: record.studentId,
    type: record.type,
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
  const studentId = new URL(request.url).searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId الزامی است' }, { status: 400 });
  if (!(await canViewStudentTasks(ctx, studentId))) {
    return NextResponse.json({ error: 'دسترسی به خواب این دانش‌آموز مجاز نیست' }, { status: 403 });
  }
  const records = await db.sleepRecord.findMany({ where: { studentId }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ records: records.map(parseRecord) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    // Students log their own sleep; their assigned advisor can log on their
    // behalf (same rule as tasks / non-study activities).
    const isSelf = ctx.user.role === 'STUDENT' && ctx.userId === body.studentId;
    const isManagingAdvisor = ctx.user.role === 'ADVISOR' && typeof body.studentId === 'string'
      && (await canViewStudentTasks(ctx, body.studentId));
    if (!isSelf && !isManagingAdvisor) {
      return NextResponse.json({ error: 'اجازه ثبت خواب برای این دانش‌آموز را ندارید' }, { status: 403 });
    }
    const isNight = body.type === 'NIGHT';
    const isNap = body.type === 'NAP';
    if (!isNight && !isNap) return NextResponse.json({ error: 'نوع خواب معتبر نیست' }, { status: 400 });
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'تاریخ معتبر الزامی است' }, { status: 400 });
    }
    if (!isValidTimeString(body.startTime)) {
      return NextResponse.json({ error: 'ساعت شروع معتبر نیست (HH:mm)' }, { status: 400 });
    }

    let endTime: string | null = null;
    let durationMinutes: number;
    if (isNight) {
      if (!isValidTimeString(body.endTime)) {
        return NextResponse.json({ error: 'ساعت بیداری معتبر نیست (HH:mm)' }, { status: 400 });
      }
      endTime = body.endTime.trim();
      durationMinutes = nightSleepMinutes(body.startTime.trim(), endTime as string);
      if (durationMinutes <= 0 || durationMinutes > 1440) {
        return NextResponse.json({ error: 'طول خواب معتبر نیست' }, { status: 400 });
      }
    } else {
      if (typeof body.durationMinutes !== 'number' || !Number.isFinite(body.durationMinutes) || body.durationMinutes < 1 || body.durationMinutes > 480) {
        return NextResponse.json({ error: 'مدت چرت باید بین ۱ تا ۴۸۰ دقیقه باشد' }, { status: 400 });
      }
      durationMinutes = Math.round(body.durationMinutes);
    }

    const record = await db.sleepRecord.upsert({
      where: { studentId_date_type: { studentId: body.studentId, date: body.date, type: body.type } },
      create: {
        studentId: body.studentId,
        type: body.type,
        date: body.date,
        startTime: body.startTime.trim(),
        endTime,
        durationMinutes,
      },
      update: {
        startTime: body.startTime.trim(),
        endTime,
        durationMinutes,
      },
    });
    return NextResponse.json({ record: parseRecord(record) }, { status: 201 });
  } catch (cause) {
    console.error('POST /api/sleep error:', cause);
    return NextResponse.json({ error: 'خطا در ثبت خواب' }, { status: 500 });
  }
}
