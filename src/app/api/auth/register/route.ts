import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateToken, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth';

// ===== POST /api/auth/register =====
// Sign-up / onboarding endpoint.
//
// Creates a new user from the onboarding wizard payload and issues a signed
// session cookie so the user is immediately authenticated for all subsequent
// /api/* calls (tasks, exams, messages, ...).
//
// Supported roles (self-registration):
//   - STUDENT           → requires grade + major
//   - ADVISOR           → no extra fields (can be linked to an institute later
//                         by a super-admin or institute-manager)
//   - INSTITUTE_MANAGER → optional `instituteName` creates a new Institute and
//                         links the manager to it
//
// SUPER_ADMIN accounts cannot be self-registered — they are seed-only.
//
// If a user with the given phone already exists (e.g. a seeded demo account or
// a returning user), we treat this as a login instead: verify the OTP-as-password
// ('1234' by convention with the onboarding OTP), refresh their profile fields
// from the wizard, and issue a fresh session. This keeps the onboarding flow
// idempotent for demo accounts that were pre-seeded.
//
// Body:
//   phone            string  required (Iranian mobile, digits only)
//   name             string  required
//   role             string  optional ('STUDENT' | 'ADVISOR' | 'INSTITUTE_MANAGER', default 'STUDENT')
//   avatar           string  optional (emoji, defaults to 🦊)
//   grade            string  optional (دهم | یازدهم | دوازدهم | پشت کنکوری) — STUDENT only
//   major            string  optional (تجربی | ریاضی | انسانی) — STUDENT only
//   goal             string  optional (کنکور | نهایی | هر دو)
//   dailyTargetHours number  optional (default 6) — STUDENT only
//   instituteName    string  optional — INSTITUTE_MANAGER only (creates a new Institute)
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
    const instituteName =
      typeof body.instituteName === 'string' ? body.instituteName.trim() : '';
    const dailyTargetHours =
      typeof body.dailyTargetHours === 'number' && body.dailyTargetHours > 0
        ? Math.min(Math.floor(body.dailyTargetHours), 16)
        : 6;
    // The onboarding wizard uses OTP '1234'. We reuse it as the account password
    // so the same credential works for both /api/auth/register and /api/auth/login.
    const password = typeof body.password === 'string' && body.password ? body.password : '1234';

    // Validate role — only STUDENT, ADVISOR, INSTITUTE_MANAGER can self-register.
    const VALID_ROLES = ['STUDENT', 'ADVISOR', 'INSTITUTE_MANAGER'] as const;
    const role: (typeof VALID_ROLES)[number] =
      typeof body.role === 'string' && (VALID_ROLES as readonly string[]).includes(body.role)
        ? (body.role as (typeof VALID_ROLES)[number])
        : 'STUDENT';

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
    // STUDENT requires grade + major; ADVISOR / INSTITUTE_MANAGER don't.
    if (role === 'STUDENT') {
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
          ...(role === 'STUDENT' ? { dailyTargetHours } : {}),
        },
      });
    } else {
      // Brand-new account.
      const hashedPassword = await bcrypt.hash(password, 10);

      // For INSTITUTE_MANAGER with an institute name, create the user first,
      // then create the Institute with the user as its manager. The Institute
      // model requires a unique managerId, so we must create the user first
      // and then link the institute to them.
      if (role === 'INSTITUTE_MANAGER' && instituteName) {
        const result = await db.$transaction(async (tx) => {
          const manager = await tx.user.create({
            data: {
              phone: normalizedPhone,
              password: hashedPassword,
              name,
              avatar,
              role: 'INSTITUTE_MANAGER',
              isActive: true,
            },
          });
          const institute = await tx.institute.create({
            data: {
              name: instituteName,
              managerId: manager.id,
              subscriptionPlan: 'free',
              status: 'active',
            },
          });
          // Link the manager back to the institute.
          return tx.user.update({
            where: { id: manager.id },
            data: { instituteId: institute.id },
          });
        });
        user = result;
      } else {
        user = await db.user.create({
          data: {
            phone: normalizedPhone,
            password: hashedPassword,
            name,
            avatar,
            role,
            // Only STUDENT gets grade/major/goal/dailyTargetHours.
            ...(role === 'STUDENT'
              ? {
                  grade: grade || 'دوازدهم',
                  major: major || 'تجربی',
                  goal: goal || 'کنکور',
                  dailyTargetHours,
                }
              : {}),
            isActive: true,
          },
        });
      }
    }

    // Strip password before returning.
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(user.id);
    const response = NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'حساب شما با موفقیت ساخته شد',
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
