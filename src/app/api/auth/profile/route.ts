import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { isTrustedMutationOrigin } from '@/lib/request-origin';

// ============================================================
// PATCH /api/auth/profile
// ============================================================
// Self-service endpoint for the AUTHENTICATED user to update their own profile
// (firstName, lastName, avatar, grade, major, province, city).
//
// This fixes the long-standing bug where SettingsView.handleSaveProfile only
// updated the local Zustand store + localStorage, but never sent the update
// to the server. On the next /api/auth/me fetch (e.g. on window focus, or
// page reload), the server record (still the old value) would overwrite the
// local change — making it appear as if profile edits "didn't stick".
//
// This endpoint:
//   1. Requires authentication (requireAuth).
//   2. Validates CSRF via the Origin header (isTrustedMutationOrigin).
//   3. Validates and applies the allowed subset of fields.
//   4. Returns the updated user so the client can replace its store value
//      with the server's source of truth.
//
// Body (all OPTIONAL — only the fields the client wants to change):
//   firstName  string  (required field; if provided, must be non-empty)
//   lastName   string  (nullable — empty string clears it)
//   avatar     string  (emoji)
//   grade      string  (دهم | یازدهم | دوازدهم | فارغ‌التحصیل)
//   major      string  (تجربی | ریاضی | انسانی)
//   province   string  (nullable)
//   city       string  (nullable)
// ============================================================

const VALID_GRADES = new Set(['دهم', 'یازدهم', 'دوازدهم', 'فارغ‌التحصیل']);
const VALID_MAJORS = new Set(['تجربی', 'ریاضی', 'انسانی']);

export async function PATCH(request: NextRequest) {
  // CSRF: same-origin POST/PATCH requires a trusted Origin.
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: 'مبدأ درخواست معتبر نیست' }, { status: 403 });
  }

  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    // firstName — required field, but only update if a non-empty value is provided.
    if (typeof body.firstName === 'string') {
      const trimmed = body.firstName.trim();
      if (!trimmed) {
        return NextResponse.json({ error: 'نام نمی‌تواند خالی باشد' }, { status: 400 });
      }
      data.firstName = trimmed;
    }

    // lastName — nullable. Empty string explicitly clears it.
    if (typeof body.lastName === 'string') {
      const trimmed = body.lastName.trim();
      data.lastName = trimmed || null;
    }

    // avatar — emoji string, must be non-empty if provided.
    if (typeof body.avatar === 'string' && body.avatar.trim()) {
      data.avatar = body.avatar.trim();
    }

    // grade — must be one of the valid set if provided.
    if (typeof body.grade === 'string') {
      const trimmed = body.grade.trim();
      if (!VALID_GRADES.has(trimmed)) {
        return NextResponse.json({ error: 'پایه تحصیلی نامعتبر است' }, { status: 400 });
      }
      data.grade = trimmed;
    }

    // major — must be one of the valid set if provided.
    if (typeof body.major === 'string') {
      const trimmed = body.major.trim();
      if (!VALID_MAJORS.has(trimmed)) {
        return NextResponse.json({ error: 'رشته تحصیلی نامعتبر است' }, { status: 400 });
      }
      data.major = trimmed;
    }

    // province — nullable. Empty string clears it.
    if (typeof body.province === 'string') {
      data.province = body.province.trim() || null;
    }

    // city — nullable. Empty string clears it.
    if (typeof body.city === 'string') {
      data.city = body.city.trim() || null;
    }

    // If the client didn't pass anything, return the current user without an update.
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: ctx.userId },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        role: true,
        grade: true,
        major: true,
        province: true,
        city: true,
        assignedAdvisorId: true,
        publicCode: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی پروفایل' }, { status: 500 });
  }
}
