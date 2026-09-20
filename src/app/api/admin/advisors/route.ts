import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { createPublicCode } from '@/lib/public-code';

function withDisplayName<T extends { firstName: string; lastName: string | null }>(user: T) {
  return {
    ...user,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
  };
}

const advisorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  phone: true,
  publicCode: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function GET(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  const advisors = await db.user.findMany({
    where: { role: 'ADVISOR', deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: advisorSelect,
  });
  return NextResponse.json({ advisors: advisors.map(withDisplayName) });
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error || !ctx) return error;
  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    // Accept either explicit firstName/lastName or a legacy single `name` (split on first space).
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim()
      : typeof body.name === 'string' && body.name.trim() ? body.name.trim().split(' ')[0] : '';
    const lastName = typeof body.lastName === 'string' && body.lastName.trim() ? body.lastName.trim()
      : typeof body.name === 'string' && body.name.trim() && body.name.trim().includes(' ') ? body.name.trim().split(' ').slice(1).join(' ') : null;
    if (!phone || !firstName) return NextResponse.json({ error: 'نام و شماره موبایل الزامی است' }, { status: 400 });
    const existing = await db.user.findUnique({ where: { phone }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'این شماره قبلاً در سیستم ثبت شده است' }, { status: 409 });
    const advisor = await db.user.create({
      data: { phone, firstName, lastName, avatar: typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊', role: 'ADVISOR', publicCode: await createPublicCode('ADV'), password: null, isActive: true, phoneVerifiedAt: null },
      select: advisorSelect,
    });
    return NextResponse.json({ advisor: withDisplayName(advisor) }, { status: 201 });
  } catch (err) {
    console.error('Advisor creation error:', err);
    return NextResponse.json({ error: 'ساخت حساب مشاور انجام نشد' }, { status: 500 });
  }
}
