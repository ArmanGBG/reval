import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME } from '@/lib/auth';

// ===== POST /api/auth/register =====
// Sign-up / onboarding endpoint.
//
// Creates a new STUDENT user from the onboarding wizard payload and issues a
// signed session cookie so the user is immediately authenticated for all
// subsequent /api/* calls (tasks, exams, messages, ...).
//
// If a user with the given phone already exists (e.g. a seeded demo account or
// a returning user), we treat this as a login instead: verify the OTP-as-password
// ('1234' by convention with the onboarding OTP), refresh their profile fields
// from the wizard, and issue a fresh session. This keeps the onboarding flow
// idempotent for demo accounts that were pre-seeded.
//
// Body:
//   phone            string  required (Iranian mobile, digits only — stored as-is)
//   name             string  required
//   avatar           string  optional (emoji, defaults to 🦊)
//   grade            string  optional (دهم | یازدهم | دوازدهم | پشت کنکوری)
//   major            string  optional (تجربی | ریاضی | انسانی | معارف)
//   goal             string  optional (کنکور | نهایی | هر دو)
//   dailyTargetHours number  optional (default 6)
//   password         string  optional (default '1234' — matches onboarding OTP)
//
// Returns: { user, token, message } and sets the `reval-session` httpOnly cookie.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const avatar = typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊';
    const grade = typeof body.grade === 'string' ? body.grade : null;
    const major = typeof body.major === 'string' ? body.major : null;
    const goal = typeof body.goal === 'string' ? body.goal : null;
    const dailyTargetHours =
      typeof body.dailyTargetHours === 'number' && body.dailyTargetHours > 0
        ? Math.min(Math.floor(body.dailyTargetHours), 16)
        : 6;
    // The onboarding wizard uses OTP '1234'. We reuse it as the account password
    // so the same credential works for both /api/auth/register and /api/auth/login.
    const password = typeof body.password === 'string' && body.password ? body.password : '1234';

    if (!phone) {
      return NextResponse.json(
        { error: 'شماره تلفن الزامی است' },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 },
      );
    }

    // Normalize Iranian phone: strip leading 0 or +98 / 98 so we compare consistently.
    const normalizedPhone = phone.replace(/^(\+?98|0)?/, '0');

    const existing = await db.user.findUnique({
      where: { phone: normalizedPhone },
    });

    let user;
    if (existing) {
      // Returning user — verify password before issuing a session.
      const passwordMatch = await bcrypt.compare(password, existing.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'این شماره قبلاً ثبت شده. رمز عبور اشتباه است.' },
          { status: 401 },
        );
      }
      if (!existing.isActive) {
        return NextResponse.json(
          { error: 'حساب شما غیرفعال شده است' },
          { status: 403 },
        );
      }
      // Refresh profile fields from the onboarding wizard (non-destructive: only
      // overwrite fields the wizard actually collected).
      user = await db.user.update({
        where: { id: existing.id },
        data: {
          name,
          avatar,
          ...(grade ? { grade } : {}),
          ...(major ? { major } : {}),
          ...(goal ? { goal } : {}),
          dailyTargetHours,
        },
      });
    } else {
      // Brand-new student account.
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await db.user.create({
        data: {
          phone: normalizedPhone,
          password: hashedPassword,
          name,
          avatar,
          role: 'STUDENT',
          grade: grade || 'دوازدهم',
          major: major || 'تجربی',
          goal: goal || 'کنکور',
          dailyTargetHours,
          isActive: true,
        },
      });
    }

    // Strip password before returning.
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'حساب شما با موفقیت ساخته شد',
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400, // 24 hours — matches login
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
      { status: 500 },
    );
  }
}
