// ===== Persian Text Normalization =====
// Central normalization for Persian/Arabic text to prevent duplicate records
// that differ only in character variants (ی/ي, ک/ك, spaces, ZWNJ, etc.).

/**
 * Normalize a Persian/Arabic string for deduplication and comparison.
 *
 * Transformations:
 *   1. Trim leading/trailing whitespace
 *   2. Remove control characters
 *   3. Convert Arabic Yeh (ي U+064A) → Persian Yeh (ی U+06CC)
 *   4. Convert Arabic Kaf (ك U+0643) → Persian Kaf (ک U+06A9)
 *   5. Convert Arabic dagger alef (أإآ) → plain alef (ا) — optional but common
 *   6. Convert all whitespace variants (incl. ZWNJ U+200C, NBSP U+00A0) to a
 *      single regular space, then collapse consecutive spaces into one
 *   7. Normalize to NFC form
 *   8. Lowercase (affects Latin chars only — Persian has no case)
 *
 * The result is used as a `normalizedName` stored alongside the user-visible
 * `name`, with a unique constraint so the DB enforces uniqueness on the
 * normalized form.
 */
export function normalizePersianText(input: string): string {
  if (typeof input !== 'string') return '';

  let s = input;

  // 1. Trim
  s = s.trim();

  // 2. Remove control characters (keep newlines/tabs as spaces, strip others)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 3. Arabic Yeh → Persian Yeh
  s = s.replace(/\u064A/g, '\u06CC'); // ي → ی

  // 4. Arabic Kaf → Persian Kaf
  s = s.replace(/\u0643/g, '\u06A9'); // ك → ک

  // 5. Arabic alef variants → plain alef
  s = s.replace(/[\u0622\u0623\u0625]/g, '\u0627'); // آأإ → ا

  // 6. Whitespace normalization: ZWNJ, NBSP, tabs, newlines → single space
  //    ZWNJ (U+200C) is kept in Persian compound words, but for *names* we
  //    collapse it to space so "ریاضی‌شناسی" and "ریاضی شناسی" don't
  //    appear as two different subjects.
  s = s.replace(/[\u200C\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\n]/g, ' ');
  // Collapse consecutive spaces
  s = s.replace(/ +/g, ' ');
  s = s.trim();

  // 7. Normalize to NFC
  s = s.normalize('NFC');

  // 8. Lowercase (Latin only)
  s = s.toLowerCase();

  return s;
}

/**
 * Validate that a string is a non-empty normalized name.
 * Returns the normalized name, or null if invalid.
 */
export function normalizeSubjectName(name: string): string | null {
  const normalized = normalizePersianText(name);
  return normalized.length > 0 ? normalized : null;
}
