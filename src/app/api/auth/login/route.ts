import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';
import { createPublicCode } from '@/lib/public-code';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';

    if (!phone || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'شماره موبایل و کد تایید معتبر الزامی است' },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({
      where: { phone },
      include: {
        institute: {
          select: { id: true, name: true },
        },
        assignedAdvisor: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!(await verifyOtp(phone, 'LOGIN', otp))) {
      return NextResponse.json(
        { error: 'کد تایید نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    const bootstrapPhones = (process.env.INITIAL_SUPER_ADMIN_PHONES || process.env.INITIAL_SUPER_ADMIN_PHONE || '')
      .split(',')
      .map((value) => normalizeIranianPhone(value.trim()))
      .filter((value): value is string => Boolean(value));
    const isBootstrapSuperAdmin = bootstrapPhones.includes(phone);

    if (!user) {
      if (!isBootstrapSuperAdmin) {
        return NextResponse.json({ error: 'کاربری با این شماره تلفن یافت نشد' }, { status: 404 });
      }
      user = await db.user.create({
        data: {
          phone,
          name: process.env.INITIAL_SUPER_ADMIN_NAME?.trim() || 'مدیر روال',
          role: 'SUPER_ADMIN',
          avatar: '🛡️',
          publicCode: await createPublicCode('ADV'),
          phoneVerifiedAt: new Date(),
          isActive: true,
        },
        include: {
          institute: { select: { id: true, name: true } },
          assignedAdvisor: { select: { id: true, name: true, avatar: true } },
        },
      });
    } else if (isBootstrapSuperAdmin && (user.role !== 'SUPER_ADMIN' || !user.phoneVerifiedAt)) {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN', phoneVerifiedAt: user.phoneVerifiedAt ?? new Date(), isActive: true },
        include: {
          institute: { select: { id: true, name: true } },
          assignedAdvisor: { select: { id: true, name: true, avatar: true } },
        },
      });
    } else if (!user.phoneVerifiedAt) {
      user = await db.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
        include: {
          institute: { select: { id: true, name: true } },
          assignedAdvisor: { select: { id: true, name: true, avatar: true } },
        },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'حساب شما غیرفعال شده است' },
        { status: 403 }
      );
    }

    // Generate session token
    const token = generateToken(user.id);

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      user: userWithoutPassword,
      message: 'ورود موفقیت‌آمیز بود',
    });

    // Set httpOnly session cookie.
    // Uses SameSite=None+Secure over HTTPS so the cookie is sent in the
    // cross-site preview iframe. SameSite=Lax over HTTP (localhost dev).
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(request));

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
      { status: 500 }
    );
  }
}
