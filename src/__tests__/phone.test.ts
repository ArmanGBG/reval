import { describe, expect, it } from 'vitest';
import { isIranianMobileInput, normalizeIranianPhone, numericInput } from '@/lib/phone';

describe('phone inputs', () => {
  it('keeps only digits and converts Persian and Arabic digits', () => {
    expect(numericInput('۰۹۱۲abc٣٤٥٦٧٨٩', 11)).toBe('09123456789');
  });

  it('limits phone and OTP lengths', () => {
    expect(numericInput('0912345678900', 11)).toBe('09123456789');
    expect(numericInput('12a34567', 6)).toBe('123456');
  });

  it('accepts only complete 09 mobile input', () => {
    expect(isIranianMobileInput('09123456789')).toBe(true);
    expect(isIranianMobileInput('9123456789')).toBe(false);
    expect(isIranianMobileInput('08123456789')).toBe(false);
    expect(isIranianMobileInput('0912345678')).toBe(false);
  });

  it('keeps server normalization compatible with canonical input', () => {
    expect(normalizeIranianPhone('09123456789')).toBe('09123456789');
  });
});
