import { describe, expect, it } from 'vitest';
import { needsEnglishKeyboardHint, normalizeNumericInput, toEnglishDigits } from '@/lib/digits';

describe('toEnglishDigits', () => {
  it('converts Persian digits', () => {
    expect(toEnglishDigits('۶۰')).toBe('60');
    expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('converts Arabic digits', () => {
    expect(toEnglishDigits('٦٠')).toBe('60');
    expect(toEnglishDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('leaves non-digit characters untouched', () => {
    expect(toEnglishDigits('جلسه ۱۲')).toBe('جلسه 12');
    expect(toEnglishDigits('60')).toBe('60');
    expect(toEnglishDigits('')).toBe('');
  });
});

describe('normalizeNumericInput', () => {
  it('converts Persian digits and strips non-digits', () => {
    expect(normalizeNumericInput('۶۰')).toBe('60');
    expect(normalizeNumericInput('۴۵ دقیقه')).toBe('45');
    expect(normalizeNumericInput('12.5')).toBe('125');
    expect(normalizeNumericInput('')).toBe('');
  });

  it('produces values that parse as numbers', () => {
    expect(Number(normalizeNumericInput('۹۰'))).toBe(90);
    expect(parseInt(normalizeNumericInput('۵۰'), 10)).toBe(50);
    expect(Number(normalizeNumericInput('۶۰'))).not.toBeNaN();
  });
});

describe('needsEnglishKeyboardHint', () => {
  it('fires for Persian keys on inputs that reject them', () => {
    expect(needsEnglishKeyboardHint('۶', 'number')).toBe(true);
    expect(needsEnglishKeyboardHint('۵', 'date')).toBe(true);
    expect(needsEnglishKeyboardHint('ا', 'number')).toBe(true);
    expect(needsEnglishKeyboardHint('‌', 'number')).toBe(true);
    expect(needsEnglishKeyboardHint('٦', 'time')).toBe(true);
  });

  it('stays silent for text-like inputs that accept Persian', () => {
    expect(needsEnglishKeyboardHint('۶', 'text')).toBe(false);
    expect(needsEnglishKeyboardHint('ا', 'tel')).toBe(false);
    expect(needsEnglishKeyboardHint('۶', 'password')).toBe(false);
  });

  it('stays silent for non-Persian keys', () => {
    expect(needsEnglishKeyboardHint('6', 'number')).toBe(false);
    expect(needsEnglishKeyboardHint('a', 'date')).toBe(false);
    expect(needsEnglishKeyboardHint('Enter', 'number')).toBe(false);
    expect(needsEnglishKeyboardHint('', 'number')).toBe(false);
  });
});
