import { NextRequest, NextResponse } from 'next/server';
import { normalizeIranianPhone } from '@/lib/phone';
import { requestOtp } from '@/lib/otp';
import { isSmsSandbox } from '@/lib/sms-ir';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizeIranianPhone(typeof body.phone === 'string' ? body.phone : '');
    const purpose = body.purpose === 'LOGIN' || body.purpose === 'SIGNUP' ? body.purpose : null;
    if (!phone || !purpose) return NextResponse.json({ error: 'شماره موبایل یا نوع درخواست نامعتبر است' }, { status: 400 });

    const code = await requestOtp(phone, purpose);
    return NextResponse.json({ message: isSmsSandbox() ? 'کد تست ساخته شد' : 'کد تایید ارسال شد', ...(isSmsSandbox() ? { testCode: code } : {}) });
  } catch (error) {
    if (error instanceof Error && error.message === 'OTP_COOLDOWN') {
      return NextResponse.json({ error: 'لطفاً برای ارسال مجدد کمی صبر کنید' }, { status: 429 });
    }
    if (error instanceof Error && error.message === 'SMS_IR_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'سرویس پیامک هنوز تنظیم نشده است' }, { status: 503 });
    }
    console.error('OTP request error:', error);
    return NextResponse.json({ error: 'ارسال کد تایید انجام نشد' }, { status: 502 });
  }
}
