import { describe, expect, it } from 'vitest';

type Chapter = { pageStart: number; pageEnd: number };

function overlappingCoverage(chapters: Chapter[], start: number, end: number): boolean {
  const ranges = chapters
    .filter((chapter) => chapter.pageStart <= end && start <= chapter.pageEnd)
    .map((chapter) => [Math.max(start, chapter.pageStart), Math.min(end, chapter.pageEnd)] as const)
    .sort((a, b) => a[0] - b[0]);
  let coveredThrough = start - 1;
  for (const [rangeStart, rangeEnd] of ranges) {
    if (rangeStart > coveredThrough + 1) return false;
    coveredThrough = Math.max(coveredThrough, rangeEnd);
  }
  return coveredThrough >= end;
}

describe('page ranges spanning chapters', () => {
  it('accepts a continuous range crossing Persian chapters', () => {
    expect(overlappingCoverage([{ pageStart: 25, pageEnd: 46 }, { pageStart: 47, pageEnd: 60 }], 40, 50)).toBe(true);
  });

  it('rejects a range with an uncovered page gap', () => {
    expect(overlappingCoverage([{ pageStart: 25, pageEnd: 40 }, { pageStart: 45, pageEnd: 60 }], 40, 50)).toBe(false);
  });
});
