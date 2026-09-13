import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendOtpSms } from '@/lib/sms';

const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export interface OtpVerificationResult {
  valid: boolean;
  challengeId?: string;
}

export interface OtpRequestResult {
  code: string;
  challengeId: string;
}

export async function requestOtp(phone: string, purpose: 'LOGIN' | 'SIGNUP'): Promise<string> {
  return (await requestOtpDetails(phone, purpose)).code;
}

export async function requestOtpDetails(phone: string, purpose: 'LOGIN' | 'SIGNUP'): Promise<OtpRequestResult> {
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
    await sendOtpSms(phone, code);
    return { code, challengeId: challenge.id };
  } catch (error) {
    await db.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    throw error;
  }
}

export async function verifyOtp(
  phone: string,
  purpose: 'LOGIN' | 'SIGNUP',
  code: string,
  options: { consume?: boolean; challengeId?: string } = {},
): Promise<boolean> {
  return (await verifyOtpDetails(phone, purpose, code, options)).valid;
}

/**
 * Verify a code and return the exact challenge that matched it.
 *
 * The challenge id is important for multi-step signup: a new OTP request in
 * another tab (or a delayed SMS) must not make the final registration compare
 * the already-verified code against a different, newer challenge.
 */
export async function verifyOtpDetails(
  phone: string,
  purpose: 'LOGIN' | 'SIGNUP',
  code: string,
  options: { consume?: boolean; challengeId?: string } = {},
): Promise<OtpVerificationResult> {
  const challenges = await db.otpChallenge.findMany({
    where: {
      phone,
      purpose,
      consumedAt: null,
      ...(options.challengeId ? { id: options.challengeId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options.challengeId ? 1 : 10,
  });
  const now = new Date();
  const usableChallenges = challenges.filter(
    (challenge) => challenge.expiresAt >= now && challenge.attempts < OTP_MAX_ATTEMPTS,
  );

  for (const challenge of usableChallenges) {
    if (!(await bcrypt.compare(code, challenge.codeHash))) continue;

    if (options.consume !== false) {
      const consumed = await db.otpChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) return { valid: false };
    }
    return { valid: true, challengeId: challenge.id };
  }

  // Count a failed attempt against the newest usable challenge. When a user
  // has multiple delayed SMS messages, a valid older code can still match one
  // of the active challenges above without making the newest code unusable.
  const latestUsable = usableChallenges[0];
  if (latestUsable) {
    await db.otpChallenge.update({ where: { id: latestUsable.id }, data: { attempts: { increment: 1 } } });
  }
  return { valid: false };
}
