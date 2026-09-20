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

  const recipient = toArtaRecipient(phone);
  const body = {
    sending_type: 'pattern',
    from_number: fromNumber,
    code: patternCode,
    recipients: [recipient],
    params: { [parameterName]: otp },
  };

  console.log('[ARTA DEBUG] URL:', ARTA_SEND_URL);
  console.log('[ARTA DEBUG] Headers:', { Authorization: apiToken.substring(0, 10) + '...', 'Content-Type': 'application/json' });
  console.log('[ARTA DEBUG] Body:', JSON.stringify(body, null, 2));

  const response = await fetch(ARTA_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  console.log('[ARTA DEBUG] Response status:', response.status, response.statusText);
  const responseText = await response.text();
  console.log('[ARTA DEBUG] Response body:', responseText);

  if (!response.ok) {
    let result: { message?: string } | null = null;
    try {
      result = JSON.parse(responseText);
    } catch {}
    throw new Error(result?.message || 'ARTA_SMS_SEND_FAILED');
  }
}
