/**
 * Validate or import the canonical book curriculum CSV.
 *
 * Validation is the default and never connects to the database:
 *   npm run db:seed:book:dry
 *
 * Apply an already validated file explicitly:
 *   npm run db:seed:book
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Prisma } from '@prisma/client';
import { pathToFileURL } from 'node:url';
import { db } from '../src/lib/db';
import { normalizePersianText } from '../src/lib/validators/normalize';

export const BOOK_CSV_HEADERS = [
  'نام درس',
  'پایه',
  'رشته',
  'نوع ارزیابی',
  'شماره فصل',
  'نام فصل',
  'شروع صفحه فصل',
  'پایان صفحه فصل',
  'شماره گفتار',
  'نام گفتار',
  'شروع صفحه گفتار',
  'پایان صفحه گفتار',
  'رنگ درس',
  'ترتیب درس',
  'فعال؟',
  'یادداشت',
] as const;

const DEFAULT_CSV_PATH = path.join(process.cwd(), 'seed - Data.csv');
const VALID_GRADES = new Set(['دهم', 'یازدهم', 'دوازدهم']);
const VALID_MAJORS = new Set(['تجربی', 'ریاضی', 'انسانی']);
const VALID_ASSESSMENTS = new Set(['کنکور', 'نهایی', 'هر دو']);

type AssessmentType = 'کنکور' | 'نهایی' | 'هر دو';

export type BookCurriculumRow = {
  rowNumber: number;
  subjectName: string;
  normalizedSubjectName: string;
  grade: string;
  major: string;
  assessmentType: AssessmentType;
  chapterNo: number;
  chapterTitle: string;
  chapterPageStart: number;
  chapterPageEnd: number;
  topicNo: number | null;
  topicTitle: string | null;
  topicPageStart: number | null;
  topicPageEnd: number | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

export type BookCurriculumSummary = {
  rows: number;
  subjects: number;
  gradeSubjects: number;
  chapters: number;
  topics: number;
};

type ImportCounters = {
  created: number;
  updated: number;
  reactivated: number;
  unchanged: number;
};

type ImportReport = {
  subject: ImportCounters;
  gradeSubject: ImportCounters;
  chapter: ImportCounters;
  topic: ImportCounters;
  taskRowsRefreshed: number;
};

type ChapterInput = {
  rowNumber: number;
  chapterNo: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  isActive: boolean;
  topics: TopicInput[];
};

type TopicInput = {
  rowNumber: number;
  topicNo: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  isActive: boolean;
};

type GradeSubjectInput = {
  rowNumber: number;
  grade: string;
  major: string;
  assessmentType: AssessmentType;
  sortOrder: number;
  isActive: boolean;
  chapters: ChapterInput[];
};

type SubjectInput = {
  rowNumber: number;
  name: string;
  normalizedName: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  gradeSubjects: GradeSubjectInput[];
};

type ExistingSubject = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

type ExistingGradeSubject = {
  id: string;
  sortOrder: number;
  isKonkur: boolean;
  isFinal: boolean;
  isActive: boolean;
};

type ExistingChapter = {
  id: string;
  title: string;
  pageStart: number | null;
  pageEnd: number | null;
  sortOrder: number;
  isActive: boolean;
};

type ExistingTopic = {
  id: string;
  title: string;
  pageStart: number | null;
  pageEnd: number | null;
  sortOrder: number;
  isActive: boolean;
};

function fail(fileName: string, rowNumber: number | null, message: string): never {
  const location = rowNumber === null ? fileName : `${fileName}:Data:ردیف ${rowNumber}`;
  throw new Error(`${location}: ${message}`);
}

function parseNonNegativeInteger(value: string, fileName: string, rowNumber: number, field: string): number {
  if (!/^\d+$/.test(value)) fail(fileName, rowNumber, `${field} باید عدد صحیح نامنفی انگلیسی باشد`);
  return Number(value);
}

function parsePositiveInteger(value: string, fileName: string, rowNumber: number, field: string): number {
  const number = parseNonNegativeInteger(value, fileName, rowNumber, field);
  if (number < 1) fail(fileName, rowNumber, `${field} باید حداقل 1 باشد`);
  return number;
}

function parseBoolean(value: string, fileName: string, rowNumber: number): boolean {
  if (value === 'TRUE') return true;
  if (value === 'FALSE') return false;
  return fail(fileName, rowNumber, 'فعال؟ فقط TRUE یا FALSE است');
}

function sameSet(values: Set<string>, expected: string): boolean {
  return values.size === 1 && values.has(expected);
}

export function parseBookCurriculumCsv(content: string, fileName = 'seed - Data.csv'): BookCurriculumRow[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = lines[0]?.split(',').map((cell) => cell.trim()) ?? [];
  if (header.length !== BOOK_CSV_HEADERS.length || header.some((cell, index) => cell !== BOOK_CSV_HEADERS[index])) {
    fail(fileName, 1, `header باید دقیقاً شامل ${BOOK_CSV_HEADERS.length} ستون قرارداد کتابی باشد`);
  }

  const rows: BookCurriculumRow[] = [];
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index];
    const rowNumber = index + 1;
    if (!line.trim()) continue;
    if (/^\s*,+\s*$/.test(line)) fail(fileName, rowNumber, 'ردیف خالی کامایی مجاز نیست');

    const cells = line.split(',').map((cell) => cell.trim());
    if (cells.length !== BOOK_CSV_HEADERS.length) {
      fail(fileName, rowNumber, `تعداد ستون‌ها ${cells.length} است؛ باید ${BOOK_CSV_HEADERS.length} باشد`);
    }

    const [
      subjectName,
      grade,
      major,
      assessmentType,
      chapterNo,
      chapterTitle,
      chapterPageStart,
      chapterPageEnd,
      topicNo,
      topicTitle,
      topicPageStart,
      topicPageEnd,
      color,
      sortOrder,
      active,
    ] = cells;

    if (!subjectName) fail(fileName, rowNumber, 'نام درس الزامی است');
    if (!VALID_GRADES.has(grade)) fail(fileName, rowNumber, `پایه «${grade}» معتبر نیست`);
    if (!VALID_MAJORS.has(major)) fail(fileName, rowNumber, `رشته «${major}» معتبر نیست`);
    if (!VALID_ASSESSMENTS.has(assessmentType)) fail(fileName, rowNumber, `نوع ارزیابی «${assessmentType}» معتبر نیست`);
    if (!chapterTitle) fail(fileName, rowNumber, 'نام فصل الزامی است');
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) fail(fileName, rowNumber, `رنگ درس «${color}» معتبر نیست`);

    const chapterNumber = parseNonNegativeInteger(chapterNo, fileName, rowNumber, 'شماره فصل');
    const parsedChapterStart = parsePositiveInteger(chapterPageStart, fileName, rowNumber, 'شروع صفحه فصل');
    const parsedChapterEnd = parsePositiveInteger(chapterPageEnd, fileName, rowNumber, 'پایان صفحه فصل');
    if (parsedChapterEnd < parsedChapterStart) fail(fileName, rowNumber, 'پایان صفحه فصل کمتر از شروع آن است');

    const topicCells = [topicNo, topicTitle, topicPageStart, topicPageEnd];
    const hasAnyTopicField = topicCells.some(Boolean);
    const hasAllTopicFields = topicCells.every(Boolean);
    if (hasAnyTopicField !== hasAllTopicFields) {
      fail(fileName, rowNumber, 'شماره، نام، شروع صفحه و پایان صفحه گفتار باید همگی پر یا همگی خالی باشند');
    }

    let parsedTopicNo: number | null = null;
    let parsedTopicStart: number | null = null;
    let parsedTopicEnd: number | null = null;
    if (hasAllTopicFields) {
      parsedTopicNo = parseNonNegativeInteger(topicNo, fileName, rowNumber, 'شماره گفتار');
      parsedTopicStart = parsePositiveInteger(topicPageStart, fileName, rowNumber, 'شروع صفحه گفتار');
      parsedTopicEnd = parsePositiveInteger(topicPageEnd, fileName, rowNumber, 'پایان صفحه گفتار');
      if (parsedTopicEnd < parsedTopicStart) fail(fileName, rowNumber, 'پایان صفحه گفتار کمتر از شروع آن است');
      if (parsedTopicStart < parsedChapterStart || parsedTopicEnd > parsedChapterEnd) {
        fail(fileName, rowNumber, 'بازه گفتار باید داخل بازه فصل باشد');
      }
    }

    rows.push({
      rowNumber,
      subjectName,
      normalizedSubjectName: normalizePersianText(subjectName),
      grade,
      major,
      assessmentType: assessmentType as AssessmentType,
      chapterNo: chapterNumber,
      chapterTitle,
      chapterPageStart: parsedChapterStart,
      chapterPageEnd: parsedChapterEnd,
      topicNo: parsedTopicNo,
      topicTitle: hasAllTopicFields ? topicTitle : null,
      topicPageStart: parsedTopicStart,
      topicPageEnd: parsedTopicEnd,
      color: color.toUpperCase(),
      sortOrder: parseNonNegativeInteger(sortOrder, fileName, rowNumber, 'ترتیب درس'),
      isActive: parseBoolean(active, fileName, rowNumber),
    });
  }

  if (rows.length === 0) fail(fileName, null, 'هیچ ردیف داده‌ای وجود ندارد');
  validateBookCurriculumRows(rows, fileName);
  return rows;
}

export function validateBookCurriculumRows(rows: BookCurriculumRow[], fileName = 'seed - Data.csv'): void {
  const normalizedSubjects = new Map<string, BookCurriculumRow>();
  const subjects = new Map<string, BookCurriculumRow[]>();
  const gradeSubjects = new Map<string, BookCurriculumRow[]>();
  const chapters = new Map<string, BookCurriculumRow[]>();
  const topics = new Map<string, BookCurriculumRow>();

  for (const row of rows) {
    const previousNormalized = normalizedSubjects.get(row.normalizedSubjectName);
    if (previousNormalized && previousNormalized.subjectName !== row.subjectName) {
      fail(fileName, row.rowNumber, `نام درس با ردیف ${previousNormalized.rowNumber} پس از normalize تکراری است`);
    }
    normalizedSubjects.set(row.normalizedSubjectName, row);

    const subjectRows = subjects.get(row.subjectName) ?? [];
    subjectRows.push(row);
    subjects.set(row.subjectName, subjectRows);

    const gradeKey = `${row.subjectName}|${row.grade}|${row.major}`;
    const gradeRows = gradeSubjects.get(gradeKey) ?? [];
    gradeRows.push(row);
    gradeSubjects.set(gradeKey, gradeRows);

    const chapterKey = `${gradeKey}|${row.chapterNo}`;
    const chapterRows = chapters.get(chapterKey) ?? [];
    chapterRows.push(row);
    chapters.set(chapterKey, chapterRows);

    if (row.topicNo !== null) {
      const topicKey = `${chapterKey}|${row.topicNo}`;
      const previousTopic = topics.get(topicKey);
      if (previousTopic) fail(fileName, row.rowNumber, `شماره گفتار با ردیف ${previousTopic.rowNumber} تکراری است`);
      topics.set(topicKey, row);
    }
  }

  for (const [name, subjectRows] of subjects) {
    const colors = new Set(subjectRows.map((row) => row.color));
    const states = new Set(subjectRows.map((row) => String(row.isActive)));
    if (colors.size !== 1) fail(fileName, subjectRows.at(-1)!.rowNumber, `رنگ درس «${name}» در همه ردیف‌ها یکسان نیست`);
    if (states.size !== 1) fail(fileName, subjectRows.at(-1)!.rowNumber, `وضعیت فعال درس «${name}» در همه ردیف‌ها یکسان نیست`);
  }

  for (const [key, gradeRows] of gradeSubjects) {
    const assessments = new Set(gradeRows.map((row) => row.assessmentType));
    const states = new Set(gradeRows.map((row) => String(row.isActive)));
    if (assessments.size !== 1) fail(fileName, gradeRows.at(-1)!.rowNumber, `نوع ارزیابی ${key} یکسان نیست`);
    if (states.size !== 1) fail(fileName, gradeRows.at(-1)!.rowNumber, `وضعیت فعال ${key} یکسان نیست`);
  }

  for (const [key, chapterRows] of chapters) {
    const first = chapterRows[0];
    if (!sameSet(new Set(chapterRows.map((row) => row.chapterTitle)), first.chapterTitle)
      || !sameSet(new Set(chapterRows.map((row) => String(row.chapterPageStart))), String(first.chapterPageStart))
      || !sameSet(new Set(chapterRows.map((row) => String(row.chapterPageEnd))), String(first.chapterPageEnd))
      || !sameSet(new Set(chapterRows.map((row) => String(row.isActive))), String(first.isActive))) {
      fail(fileName, chapterRows.at(-1)!.rowNumber, `اطلاعات فصل ${key} در ردیف‌های تکرارشده یکسان نیست`);
    }
  }
}

export function summarizeBookCurriculum(rows: BookCurriculumRow[]): BookCurriculumSummary {
  return {
    rows: rows.length,
    subjects: new Set(rows.map((row) => row.subjectName)).size,
    gradeSubjects: new Set(rows.map((row) => `${row.subjectName}|${row.grade}|${row.major}`)).size,
    chapters: new Set(rows.map((row) => `${row.subjectName}|${row.grade}|${row.major}|${row.chapterNo}`)).size,
    topics: rows.filter((row) => row.topicNo !== null).length,
  };
}

function buildImportTree(rows: BookCurriculumRow[]): SubjectInput[] {
  const subjects = new Map<string, SubjectInput>();
  const grades = new Map<string, GradeSubjectInput>();
  const chapters = new Map<string, ChapterInput>();

  for (const row of rows) {
    let subject = subjects.get(row.subjectName);
    if (!subject) {
      subject = {
        rowNumber: row.rowNumber,
        name: row.subjectName,
        normalizedName: row.normalizedSubjectName,
        color: row.color,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        gradeSubjects: [],
      };
      subjects.set(row.subjectName, subject);
    }
    subject.sortOrder = Math.min(subject.sortOrder, row.sortOrder);

    const gradeKey = `${row.subjectName}|${row.grade}|${row.major}`;
    let gradeSubject = grades.get(gradeKey);
    if (!gradeSubject) {
      gradeSubject = {
        rowNumber: row.rowNumber,
        grade: row.grade,
        major: row.major,
        assessmentType: row.assessmentType,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
        chapters: [],
      };
      grades.set(gradeKey, gradeSubject);
      subject.gradeSubjects.push(gradeSubject);
    }
    gradeSubject.sortOrder = Math.min(gradeSubject.sortOrder, row.sortOrder);

    const chapterKey = `${gradeKey}|${row.chapterNo}`;
    let chapter = chapters.get(chapterKey);
    if (!chapter) {
      chapter = {
        rowNumber: row.rowNumber,
        chapterNo: row.chapterNo,
        title: row.chapterTitle,
        pageStart: row.chapterPageStart,
        pageEnd: row.chapterPageEnd,
        isActive: row.isActive,
        topics: [],
      };
      chapters.set(chapterKey, chapter);
      gradeSubject.chapters.push(chapter);
    }

    if (row.topicNo !== null && row.topicTitle && row.topicPageStart !== null && row.topicPageEnd !== null) {
      chapter.topics.push({
        rowNumber: row.rowNumber,
        topicNo: row.topicNo,
        title: row.topicTitle,
        pageStart: row.topicPageStart,
        pageEnd: row.topicPageEnd,
        isActive: row.isActive,
      });
    }
  }

  for (const subject of subjects.values()) {
    subject.gradeSubjects.sort((a, b) => a.sortOrder - b.sortOrder || a.grade.localeCompare(b.grade, 'fa') || a.major.localeCompare(b.major, 'fa'));
    for (const gradeSubject of subject.gradeSubjects) {
      gradeSubject.chapters.sort((a, b) => a.chapterNo - b.chapterNo);
      for (const chapter of gradeSubject.chapters) chapter.topics.sort((a, b) => a.topicNo - b.topicNo);
    }
  }

  return [...subjects.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'));
}

function createCounters(): ImportCounters {
  return { created: 0, updated: 0, reactivated: 0, unchanged: 0 };
}

function changedSubject(existing: ExistingSubject, input: SubjectInput): boolean {
  return existing.name !== input.name || existing.color !== input.color || existing.sortOrder !== input.sortOrder || existing.isActive !== input.isActive;
}

function changedGradeSubject(existing: ExistingGradeSubject, input: GradeSubjectInput, isKonkur: boolean, isFinal: boolean): boolean {
  return existing.sortOrder !== input.sortOrder || existing.isKonkur !== isKonkur || existing.isFinal !== isFinal || existing.isActive !== input.isActive;
}

function changedChapter(existing: ExistingChapter, input: ChapterInput): boolean {
  return existing.title !== input.title || existing.pageStart !== input.pageStart || existing.pageEnd !== input.pageEnd || existing.sortOrder !== input.chapterNo || existing.isActive !== input.isActive;
}

function changedTopic(existing: ExistingTopic, input: TopicInput): boolean {
  return existing.title !== input.title || existing.pageStart !== input.pageStart || existing.pageEnd !== input.pageEnd || existing.sortOrder !== input.topicNo || existing.isActive !== input.isActive;
}

function countChange(counters: ImportCounters, existing: { isActive: boolean } | null, changed: boolean, nextActive: boolean): void {
  if (!existing) counters.created++;
  else if (!existing.isActive && nextActive) counters.reactivated++;
  else if (changed) counters.updated++;
  else counters.unchanged++;
}

async function importBookCurriculum(
  rows: BookCurriculumRow[],
  options: { onlyIfEmpty?: boolean } = {},
): Promise<ImportReport | null> {
  const tree = buildImportTree(rows);
  return db.$transaction(async (tx) => {
    if (options.onlyIfEmpty) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(1380273228)`;
      const subjectCount = await tx.subject.count();
      if (subjectCount > 0) return null;
    }

    const report: ImportReport = {
      subject: createCounters(),
      gradeSubject: createCounters(),
      chapter: createCounters(),
      topic: createCounters(),
      taskRowsRefreshed: 0,
    };

    for (const subjectInput of tree) {
      const existingSubject = await tx.subject.findUnique({
        where: { normalizedName: subjectInput.normalizedName },
        select: { id: true, name: true, color: true, sortOrder: true, isActive: true },
      });
      countChange(report.subject, existingSubject, Boolean(existingSubject && changedSubject(existingSubject, subjectInput)), subjectInput.isActive);
      const subject = await tx.subject.upsert({
        where: { normalizedName: subjectInput.normalizedName },
        update: { name: subjectInput.name, color: subjectInput.color, sortOrder: subjectInput.sortOrder, isActive: subjectInput.isActive },
        create: {
          name: subjectInput.name,
          normalizedName: subjectInput.normalizedName,
          color: subjectInput.color,
          sortOrder: subjectInput.sortOrder,
          isActive: subjectInput.isActive,
        },
        select: { id: true },
      });

      const refreshedTasks = await tx.task.updateMany({
        where: { subjectId: subject.id },
        data: { subject: subjectInput.name, subjectColor: subjectInput.color },
      });
      report.taskRowsRefreshed += refreshedTasks.count;

      for (const gradeInput of subjectInput.gradeSubjects) {
        const isKonkur = gradeInput.assessmentType === 'کنکور' || gradeInput.assessmentType === 'هر دو';
        const isFinal = gradeInput.assessmentType === 'نهایی' || gradeInput.assessmentType === 'هر دو';
        const gradeWhere = { subjectId_grade_major: { subjectId: subject.id, grade: gradeInput.grade, major: gradeInput.major } } as const;
        const existingGrade = await tx.gradeSubject.findUnique({
          where: gradeWhere,
          select: { id: true, sortOrder: true, isKonkur: true, isFinal: true, isActive: true },
        });
        countChange(report.gradeSubject, existingGrade, Boolean(existingGrade && changedGradeSubject(existingGrade, gradeInput, isKonkur, isFinal)), gradeInput.isActive);
        const gradeSubject = await tx.gradeSubject.upsert({
          where: gradeWhere,
          update: { sortOrder: gradeInput.sortOrder, isKonkur, isFinal, isActive: gradeInput.isActive },
          create: {
            subjectId: subject.id,
            grade: gradeInput.grade,
            major: gradeInput.major,
            sortOrder: gradeInput.sortOrder,
            isKonkur,
            isFinal,
            isActive: gradeInput.isActive,
          },
          select: { id: true },
        });

        for (const chapterInput of gradeInput.chapters) {
          const chapterWhere = { gradeSubjectId_chapterNo: { gradeSubjectId: gradeSubject.id, chapterNo: chapterInput.chapterNo } } as const;
          const existingChapter = await tx.chapter.findUnique({
            where: chapterWhere,
            select: { id: true, title: true, pageStart: true, pageEnd: true, sortOrder: true, isActive: true },
          });
          countChange(report.chapter, existingChapter, Boolean(existingChapter && changedChapter(existingChapter, chapterInput)), chapterInput.isActive);
          const chapter = await tx.chapter.upsert({
            where: chapterWhere,
            update: {
              title: chapterInput.title,
              pageStart: chapterInput.pageStart,
              pageEnd: chapterInput.pageEnd,
              sortOrder: chapterInput.chapterNo,
              isActive: chapterInput.isActive,
            },
            create: {
              gradeSubjectId: gradeSubject.id,
              chapterNo: chapterInput.chapterNo,
              title: chapterInput.title,
              pageStart: chapterInput.pageStart,
              pageEnd: chapterInput.pageEnd,
              sortOrder: chapterInput.chapterNo,
              isActive: chapterInput.isActive,
            },
            select: { id: true },
          });

          if (existingChapter && existingChapter.title !== chapterInput.title) {
            const refreshed = await tx.task.updateMany({
              where: { chapterId: chapter.id, topicId: null, topicModeId: null },
              data: { topic: chapterInput.title },
            });
            report.taskRowsRefreshed += refreshed.count;
          }

          for (const topicInput of chapterInput.topics) {
            const topicWhere = { chapterId_topicNo: { chapterId: chapter.id, topicNo: topicInput.topicNo } } as const;
            const existingTopic = await tx.topic.findUnique({
              where: topicWhere,
              select: { id: true, title: true, pageStart: true, pageEnd: true, sortOrder: true, isActive: true },
            });
            countChange(report.topic, existingTopic, Boolean(existingTopic && changedTopic(existingTopic, topicInput)), topicInput.isActive);
            const topic = await tx.topic.upsert({
              where: topicWhere,
              update: {
                title: topicInput.title,
                pageStart: topicInput.pageStart,
                pageEnd: topicInput.pageEnd,
                sortOrder: topicInput.topicNo,
                isActive: topicInput.isActive,
              },
              create: {
                chapterId: chapter.id,
                topicNo: topicInput.topicNo,
                title: topicInput.title,
                pageStart: topicInput.pageStart,
                pageEnd: topicInput.pageEnd,
                sortOrder: topicInput.topicNo,
                isActive: topicInput.isActive,
              },
              select: { id: true },
            });

            if (existingTopic && existingTopic.title !== topicInput.title) {
              const refreshed = await tx.task.updateMany({ where: { topicId: topic.id }, data: { topic: topicInput.title } });
              report.taskRowsRefreshed += refreshed.count;
            }
          }
        }
      }
    }

    return report;
  }, { maxWait: 10_000, timeout: 1_800_000, isolationLevel: 'Serializable' as Prisma.TransactionIsolationLevel });
}

function readArgument(name: string): string | null {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

export async function runBookCurriculumImport(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const onlyIfEmpty = process.argv.includes('--if-empty');
  const csvPath = path.resolve(readArgument('file') ?? DEFAULT_CSV_PATH);
  const fileName = path.basename(csvPath);
  const content = await fs.readFile(csvPath, 'utf8');
  const rows = parseBookCurriculumCsv(content, fileName);
  const summary = summarizeBookCurriculum(rows);

  console.log(`Book curriculum validation passed: ${fileName}`);
  console.table(summary);
  if (!apply) {
    console.log('Dry run only. No database writes were performed.');
    return;
  }

  const report = await importBookCurriculum(rows, { onlyIfEmpty });
  if (!report) {
    console.log('Book curriculum import skipped: curriculum tables are already initialized.');
    return;
  }
  console.log('Book curriculum import committed:');
  console.table(report);
}

export async function bootstrapBookCurriculumIfEmpty(): Promise<void> {
  const content = await fs.readFile(DEFAULT_CSV_PATH, 'utf8');
  const fileName = path.basename(DEFAULT_CSV_PATH);
  const rows = parseBookCurriculumCsv(content, fileName);
  console.log(`Book curriculum validation passed: ${fileName}`);
  console.table(summarizeBookCurriculum(rows));

  const report = await importBookCurriculum(rows, { onlyIfEmpty: true });
  if (!report) {
    console.log('Book curriculum bootstrap skipped: curriculum tables are already initialized.');
    return;
  }
  console.log('Book curriculum bootstrap committed:');
  console.table(report);
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isDirectExecution) {
  runBookCurriculumImport()
    .catch((error) => {
      console.error('Book curriculum import failed:', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
}
