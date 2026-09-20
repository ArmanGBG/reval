import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';
import { normalizeIranianPhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';
import { createPublicCode } from '@/lib/public-code';
import { detachAdvisorRoster, detachStudent } from '@/lib/user-lifecycle';

// ===== POST /api/auth/register =====
// Sign-up / onboarding endpoint.
//
// Creates a new user from the onboarding wizard payload and issues a signed
// session cookie so the user is immediately authenticated for all subsequent
// /api/* calls (tasks, exams, messages, ...).
//
// Public registration always creates a STUDENT. Role input from the client is
// intentionally ignored; advisors are created by a super-admin only.
//
// Body:
//   phone            string  required (Iranian mobile, digits only)
//   firstName        string  required (نام)
//   lastName         string  optional (نام خانوادگی)
//   avatar           string  optional (emoji, defaults to 🦊)
//   grade            string  optional (دهم | یازدهم | دوازدهم | فارغ‌التحصیل) — STUDENT only
//   major            string  optional (تجربی | ریاضی | انسانی) — STUDENT only
//   province         string  required (استان) — required for STUDENT/ADVISOR at signup
//   city             string  required (شهر) — required for STUDENT/ADVISOR at signup
//   otp              string  required, six digits verified server-side
//
// Returns: { user, token, message } and sets the `reval-session` httpOnly cookie.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' && body.lastName.trim() ? body.lastName.trim() : null;
    const avatar = typeof body.avatar === 'string' && body.avatar ? body.avatar : '🦊';
    const grade = typeof body.grade === 'string' ? body.grade : null;
    const major = typeof body.major === 'string' ? body.major : null;
    const province = typeof body.province === 'string' && body.province.trim() ? body.province.trim() : null;
    const city = typeof body.city === 'string' && body.city.trim() ? body.city.trim() : null;
    const role = 'STUDENT' as const;

    if (!phone) {
      return NextResponse.json(
        { error: 'شماره تلفن الزامی است' },
        { status: 400 },
      );
    }
    if (!firstName) {
      return NextResponse.json(
        { error: 'نام الزامی است' },
        { status: 400 },
      );
    }
    if (!grade) {
        return NextResponse.json(
          { error: 'پایه تحصیلی برای دانش‌آموز الزامی است' },
          { status: 400 },
        );
    }
    if (!major) {
        return NextResponse.json(
          { error: 'رشته تحصیلی برای دانش‌آموز الزامی است' },
          { status: 400 },
        );
    }
    if (!province) {
      return NextResponse.json(
        { error: 'استان الزامی است' },
        { status: 400 },
      );
    }
    if (!city) {
      return NextResponse.json(
        { error: 'شهر الزامی است' },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeIranianPhone(phone);
    if (!normalizedPhone) return NextResponse.json({ error: 'شماره موبایل نامعتبر است' }, { status: 400 });
    const existing = await db.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: 'این شماره قبلاً ثبت شده است. وارد حساب خود شوید', code: 'ACCOUNT_EXISTS' },
        { status: 409 },
      );
    }
    if (existing && existing.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'این شماره متعلق به یک حساب مدیریتی است و ثبت‌نام عمومی برای آن مجاز نیست', code: 'ACCOUNT_EXISTS' },
        { status: 409 },
      );
    }

    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const otpChallengeId = typeof body.otpChallengeId === 'string' ? body.otpChallengeId.trim() : undefined;
    if (!/^\d{6}$/.test(otp) || !(await verifyOtp(normalizedPhone, 'SIGNUP', otp, { challengeId: otpChallengeId }))) {
      return NextResponse.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, { status: 401 });
    }

    const publicCode = await createPublicCode('STU');
    const user = existing
      ? await db.$transaction(async (tx) => {
          await detachStudent(tx, existing.id);
          await detachAdvisorRoster(tx, existing.id);
          await tx.user.update({
            where: { id: existing.id },
            data: { phone: `deleted-${existing.id}-${Date.now()}`, password: null, phoneVerifiedAt: null },
          });
          return tx.user.create({
            data: { phone: normalizedPhone, firstName, lastName, avatar, role, publicCode, grade, major, province, city, isActive: true, phoneVerifiedAt: new Date() },
          });
        })
      : await db.user.create({
          data: { phone: normalizedPhone, firstName, lastName, avatar, role, publicCode, grade, major, province, city, isActive: true, phoneVerifiedAt: new Date() },
        });

    // Strip password before returning.
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);
    const response = NextResponse.json({
      user: userWithoutPassword,
      message: existing ? 'حساب جدید شما با موفقیت ساخته شد' : 'حساب شما با موفقیت ساخته شد',
    });

    // Set httpOnly session cookie.
    // Uses SameSite=None+Secure over HTTPS (cross-site preview iframe compat).
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions(request));

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'خطای سرور. لطفاً دوباره تلاش کنید' },
      { status: 500 },
    );
  }
}
