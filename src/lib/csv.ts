// Simple CSV generation helper.
// - Joins rows with `\n`, columns with `,`.
// - Wraps any value containing `,` `"` or `\n` in double quotes and escapes inner `"` as `""`.
// - Adds a UTF-8 BOM so Excel reads Persian characters correctly.
// - Triggers a download via Blob + URL.createObjectURL.

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  // Prepend UTF-8 BOM so Excel opens Persian text correctly.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
