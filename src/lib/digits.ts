const PERSIAN_DIGIT_OFFSET = 0x06f0;
const ARABIC_DIGIT_OFFSET = 0x0660;

export function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= PERSIAN_DIGIT_OFFSET ? PERSIAN_DIGIT_OFFSET : ARABIC_DIGIT_OFFSET));
  });
}

export function normalizeNumericInput(value: string): string {
  return toEnglishDigits(value).replace(/\D/g, '');
}

// Persian/Arabic script (letters, digits, ZWNJ) as produced by Persian keyboards.
const PERSIAN_KEY_PATTERN = /[\u0621-\u064A\u0660-\u0669\u066E-\u06D3\u06F0-\u06F9\u06FA-\u06FF\u200C]/;

// Native input types whose value grammar only accepts ASCII characters.
const ASCII_ONLY_INPUT_TYPES = new Set(['number', 'date', 'month', 'week', 'time', 'datetime-local']);

export function needsEnglishKeyboardHint(key: string, inputType: string): boolean {
  return ASCII_ONLY_INPUT_TYPES.has(inputType) && PERSIAN_KEY_PATTERN.test(key);
}
