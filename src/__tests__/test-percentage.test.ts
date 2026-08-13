import { describe, expect, it } from 'vitest';
import { calculateTestPercentage } from '@/lib/test-percentage';

describe('test percentage calculator', () => {
  it('uses the standard negative marking formula', () => {
    const result = calculateTestPercentage(3, 4, 5);
    expect(result.total).toBe(12);
    expect(result.percentage).toBeCloseTo(13.8889, 4);
    expect(result.noWrongPercentage).toBe(25);
  });

  it('returns zero for an empty test', () => {
    expect(calculateTestPercentage(0, 0, 0)).toEqual({ total: 0, percentage: 0, noWrongPercentage: 0 });
  });

  it('does not allow negative counts', () => {
    expect(calculateTestPercentage(-2, -1, 5)).toEqual({ total: 5, percentage: 0, noWrongPercentage: 0 });
  });
});
