const ARTA_SEND_URL = 'https://edge.ippanel.com/v1/api/send';

export function toArtaRecipient(phone: string): string {
  if (!/^09\d{9}$/.test(phone)) throw new Error('ARTA_INVALID_PHONE');
  return `+98${phone.slice(1)}`;
}

export async function sendArtaVerification(phone: string, otp: string): Promise<void> {
  const apiToken = process.env.ARTA_SMS_API_TOKEN?.trim();
  const patternCode = process.env.ARTA_SMS_PATTERN_CODE?.trim();
  const fromNumber = process.env.ARTA_SMS_FROM_NUMBER?.trim() || '+983000505';
  const parameterName = process.env.ARTA_SMS_OTP_PARAMETER?.trim() || 'code';

  if (!apiToken || !patternCode || !fromNumber || !parameterName) {
    throw new Error('ARTA_SMS_NOT_CONFIGURED');
  }

  const response = await fetch(ARTA_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sending_type: 'pattern',
      from_number: fromNumber,
      code: patternCode,
      recipients: [toArtaRecipient(phone)],
      params: { [parameterName]: otp },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(result?.message || 'ARTA_SMS_SEND_FAILED');
  }
}
