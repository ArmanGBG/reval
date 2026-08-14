import { sendArtaVerification } from '@/lib/sms-arta';
import { sendSmsIrVerification } from '@/lib/sms-ir';

export type SmsProvider = 'sandbox' | 'sms_ir' | 'arta';

export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (provider === 'sandbox' || provider === 'sms_ir' || provider === 'arta') return provider;
  if (provider) throw new Error('SMS_PROVIDER_INVALID');

  // Preserve existing installations until SMS_PROVIDER is configured.
  return process.env.SMS_IR_MODE === 'sandbox' ? 'sandbox' : 'sms_ir';
}

export function isSmsSandbox(): boolean {
  return getSmsProvider() === 'sandbox';
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const provider = getSmsProvider();
  if (provider === 'sandbox') return;
  if (provider === 'sms_ir') return sendSmsIrVerification(phone, code);
  return sendArtaVerification(phone, code);
}
