export function supportsFinalAssessment(grade: string): boolean {
  return grade !== 'دهم';
}

export function shouldLoadAllEligibleGrades(): boolean {
  return true;
}
