const SMS_IR_VERIFY_URL = 'https://api.sms.ir/v1/send/verify';

export function isSmsSandbox(): boolean {
  return process.env.SMS_IR_MODE === 'sandbox';
}

export async function sendSmsIrVerification(phone: string, code: string): Promise<void> {
  const apiKey = process.env.SMS_IR_API_KEY;
  const templateId = Number(process.env.SMS_IR_OTP_TEMPLATE_ID || (isSmsSandbox() ? '123456' : ''));
  if (!apiKey || !Number.isInteger(templateId) || templateId <= 0) {
    throw new Error('SMS_IR_NOT_CONFIGURED');
  }

  const response = await fetch(SMS_IR_VERIFY_URL, {
    method: 'POST',
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      mobile: phone,
      templateId,
      parameters: [{ name: process.env.SMS_IR_OTP_PARAMETER || (isSmsSandbox() ? 'Code' : 'CODE'), value: code }],
    }),
  });

  const result = (await response.json().catch(() => null)) as { status?: number; message?: string } | null;
  if (!response.ok || result?.status !== 1) {
    throw new Error(result?.message || 'SMS_IR_SEND_FAILED');
  }
}
