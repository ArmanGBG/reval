import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendArtaVerification, toArtaRecipient } from '@/lib/sms-arta';
import { getSmsProvider, isSmsSandbox, sendOtpSms } from '@/lib/sms';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('SMS provider selection', () => {
  it.each(['sandbox', 'sms_ir', 'arta'] as const)('selects %s explicitly', (provider) => {
    process.env.SMS_PROVIDER = provider;
    expect(getSmsProvider()).toBe(provider);
    expect(isSmsSandbox()).toBe(provider === 'sandbox');
  });

  it('keeps the legacy sandbox setting compatible', () => {
    delete process.env.SMS_PROVIDER;
    process.env.SMS_IR_MODE = 'sandbox';
    expect(getSmsProvider()).toBe('sandbox');
  });

  it('rejects an unknown provider', () => {
    process.env.SMS_PROVIDER = 'unknown';
    expect(() => getSmsProvider()).toThrow('SMS_PROVIDER_INVALID');
  });

  it('does not call a provider in sandbox mode', async () => {
    process.env.SMS_PROVIDER = 'sandbox';
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await sendOtpSms('09123456789', '123456');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Arta SMS provider', () => {
  it('converts canonical Iranian mobile numbers to E.164', () => {
    expect(toArtaRecipient('09123456789')).toBe('+989123456789');
    expect(() => toArtaRecipient('9123456789')).toThrow('ARTA_INVALID_PHONE');
  });

  it('sends the configured pattern payload', async () => {
    process.env.ARTA_SMS_API_TOKEN = 'test-token';
    process.env.ARTA_SMS_PATTERN_CODE = 'test-pattern';
    process.env.ARTA_SMS_FROM_NUMBER = '+983000505';
    process.env.ARTA_SMS_OTP_PARAMETER = 'code';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));

    await sendArtaVerification('09123456789', '458921');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://edge.ippanel.com/v1/api/send');
    expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'test-token' }));
    expect(JSON.parse(String(init?.body))).toEqual({
      sending_type: 'pattern',
      from_number: '+983000505',
      code: 'test-pattern',
      recipients: ['+989123456789'],
      params: { code: '458921' },
    });
  });

  it('fails before sending when configuration is incomplete', async () => {
    delete process.env.ARTA_SMS_API_TOKEN;
    delete process.env.ARTA_SMS_PATTERN_CODE;
    await expect(sendArtaVerification('09123456789', '123456')).rejects.toThrow('ARTA_SMS_NOT_CONFIGURED');
  });
});
