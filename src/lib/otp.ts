import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { isSmsSandbox, sendSmsIrVerification } from '@/lib/sms-ir';

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export async function requestOtp(phone: string, purpose: 'LOGIN' | 'SIGNUP'): Promise<string> {
  const latest = await db.otpChallenge.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: 'desc' },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < OTP_COOLDOWN_MS) {
    throw new Error('OTP_COOLDOWN');
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const challenge = await db.otpChallenge.create({
    data: {
      phone,
      purpose,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  try {
    // Sandbox mode intentionally skips the provider and returns the generated
    // code through the local-only test response.
    if (!isSmsSandbox()) await sendSmsIrVerification(phone, code);
    return code;
  } catch (error) {
    await db.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    throw error;
  }
}

export async function verifyOtp(phone: string, purpose: 'LOGIN' | 'SIGNUP', code: string): Promise<boolean> {
  const challenge = await db.otpChallenge.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!challenge || challenge.expiresAt < new Date() || challenge.attempts >= OTP_MAX_ATTEMPTS) return false;

  const matches = await bcrypt.compare(code, challenge.codeHash);
  if (!matches) {
    await db.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    return false;
  }

  await db.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
  return true;
}
