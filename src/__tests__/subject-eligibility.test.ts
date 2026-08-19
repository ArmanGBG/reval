import { describe, expect, it } from 'vitest';
import { shouldLoadAllEligibleGrades, supportsFinalAssessment } from '@/lib/subject-eligibility';

describe('final assessment eligibility', () => {
  it('does not expose final assessment for grade ten books', () => {
    expect(supportsFinalAssessment('دهم')).toBe(false);
  });

  it('allows final assessment data for upper grades', () => {
    expect(supportsFinalAssessment('یازدهم')).toBe(true);
    expect(supportsFinalAssessment('دوازدهم')).toBe(true);
  });

  it('keeps every displayed eligible book available after field selection', () => {
    expect(shouldLoadAllEligibleGrades()).toBe(true);
  });
});
