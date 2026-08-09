import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const advisors = await db.user.findMany({
    where: { role: 'ADVISOR' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, avatar: true, phone: true, publicCode: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ advisors });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!phone || !name) return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
    const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'این شماره قبلاً در سیستم ثبت شده است' }, { status: 409 });
    const advisor = await db.user.create({
      data: { phone, name, avatar: typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊', role: 'ADVISOR', publicCode: await createPublicCode('ADV'), password: null, isActive: true, phoneVerifiedAt: null },
      select: { id: true, name: true, avatar: true, phone: true, publicCode: true, role: true, isActive: true, createdAt: true },
    });
    return NextResponse.json({ advisor }, { status: 201 });
  } catch (error) {
    console.error('Advisor creation error:', error);
    return NextResponse.json({ error: 'ساخت حساب مشاور انجام نشد' }, { status: 500 });
  }
}
