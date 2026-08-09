import { NextRequest, NextResponse } from 'next/server';
import { normalizeIranianPhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    const purpose = body.purpose === 'LOGIN' || body.purpose === 'SIGNUP' ? body.purpose : null;
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!phone || !purpose || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'اطلاعات کد تایید نامعتبر است' }, { status: 400 });
    }
    const valid = await verifyOtp(phone, purpose, code);
    return valid
      ? NextResponse.json({ verified: true })
      : NextResponse.json({ error: 'کد تایید نامعتبر یا منقضی شده است' }, { status: 401 });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
