import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'شماره تلفن و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
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

    if (!user) {
      return NextResponse.json(
        { error: 'کاربری با این شماره تلفن یافت نشد' },
        { status: 404 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'رمز عبور اشتباه است' },
        { status: 401 }
      );
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
      token,
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
