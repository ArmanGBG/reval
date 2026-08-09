const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(ARABIC_DIGITS.indexOf(digit));
  });
}

export function normalizeIranianPhone(value: string): string | null {
  let phone = toLatinDigits(value).replace(/[\s-]/g, '');
  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith('98')) phone = `0${phone.slice(2)}`;
  else if (phone.startsWith('9')) phone = `0${phone}`;

  return /^09\d{9}$/.test(phone) ? phone : null;
}
