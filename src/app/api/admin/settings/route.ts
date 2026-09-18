import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== GET /api/admin/settings =====
// Returns all platform settings as a key-value object. Seeds defaults
// on first call so the UI never renders with an empty state.
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  // Seed defaults if the table is empty (first run).
  const count = await db.platformSetting.count();
  if (count === 0) {
    await db.platformSetting.createMany({
      data: [
        { key: 'maintenanceMode', value: 'false' },
        { key: 'allowRegistration', value: 'true' },
        { key: 'maxStudentsFree', value: '5' },
        { key: 'maxStudentsBasic', value: '20' },
        { key: 'maxStudentsPro', value: '100' },
        { key: 'maxStudentsEnterprise', value: '500' },
      ],
    });
  }

  const settings = await db.platformSetting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) result[s.key] = s.value;
  return NextResponse.json({ settings: result });
}

// ===== PATCH /api/admin/settings =====
// Accepts a partial object of { key: value } pairs and upserts each one.
// Also writes an audit log entry for the change.
export async function PATCH(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const body = await request.json();
  const updates = body.settings as Record<string, string> | undefined;
  if (!updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'بدنه درخواست نامعتبر است' }, { status: 400 });
  }

  // Upsert each key-value pair.
  for (const [key, value] of Object.entries(updates)) {
    await db.platformSetting.upsert({
      where: { key },
      update: { value: String(value), updatedBy: ctx.userId },
      create: { key, value: String(value), updatedBy: ctx.userId },
    });
  }

  // Audit log.
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: 'UPDATE',
      entity: 'PlatformSetting',
      details: JSON.stringify(updates),
    },
  });

  return NextResponse.json({ ok: true });
}
