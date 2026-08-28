import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseBookCurriculumCsv, summarizeBookCurriculum } from '../../prisma/sync-curriculum-from-csv';

describe('geology seed CSV', () => {
  it('converts the legacy geology data into the canonical curriculum contract', () => {
    const filePath = path.join(process.cwd(), 'public/zamin.csv');
    const rows = parseBookCurriculumCsv(readFileSync(filePath, 'utf8'), 'zamin.csv');

    expect(summarizeBookCurriculum(rows)).toEqual({
      rows: 59,
      subjects: 1,
      gradeSubjects: 1,
      chapters: 7,
      topics: 59,
    });
    expect(rows[0]).toMatchObject({
      subjectName: 'زمین‌شناسی',
      grade: 'یازدهم',
      major: 'تجربی',
      assessmentType: 'کنکور',
      chapterPageStart: 10,
      chapterPageEnd: 22,
      color: '#8B6F47',
      isActive: true,
    });
    expect(rows.at(-1)).toMatchObject({ chapterNo: 7, chapterPageStart: 110, chapterPageEnd: 124 });
  });
});
