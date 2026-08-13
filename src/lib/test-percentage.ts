export function calculateTestPercentage(correct: number, wrong: number, blank: number) {
  const safeCorrect = Math.max(0, Math.floor(correct));
  const safeWrong = Math.max(0, Math.floor(wrong));
  const safeBlank = Math.max(0, Math.floor(blank));
  const total = safeCorrect + safeWrong + safeBlank;
  if (total === 0) return { total: 0, percentage: 0, noWrongPercentage: 0 };
  return {
    total,
    percentage: ((safeCorrect * 3 - safeWrong) / (total * 3)) * 100,
    noWrongPercentage: (safeCorrect / total) * 100,
  };
}

export function formatTestPercentage(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(rounded)}٪`;
}
