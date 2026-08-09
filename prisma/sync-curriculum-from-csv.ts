/**
 * Non-destructive curriculum sync for production databases.
 *
 * Unlike seed-from-csv.ts, this script never deletes Subjects, curriculum
 * nodes, or Tasks. It upserts the rows from both curriculum CSV files and
 * refreshes denormalized Task text fields for linked curriculum records.
 *
 * Run after migrations with:
 *   bun run db:seed
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/db';
import { normalizePersianText } from '../src/lib/validators/normalize';

const CSV_PATHS = ['dbseed.csv', 'zamin.csv'].map((file) => path.join(process.cwd(), 'public', file));

type Row = {
  subject: string; grade: string; major: string; chapterTitle: string;
  chapterNo: number; topicTitle: string | null; topicNo: number | null;
  pageStart: number | null; pageEnd: number | null;
};

const META: Record<string, { color: string; icon: string; isKonkur: boolean }> = {
  'زیست‌شناسی': { color: '#8B5CF6', icon: '🧬', isKonkur: true },
  'فیزیک': { color: '#F59E0B', icon: '⚛️', isKonkur: true },
  'شیمی': { color: '#EF4444', icon: '⚗️', isKonkur: true },
  'ریاضی': { color: '#3EB489', icon: '📐', isKonkur: true },
  'زمین‌شناسی': { color: '#16A34A', icon: '🌍', isKonkur: true },
};

function intOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error(`عدد نامعتبر در CSV: ${value}`);
  return number;
}

function parse(content: string): Row[] {
  return content.replace(/^\uFEFF/, '').split(/\r?\n/).slice(1).flatMap((line, offset) => {
    const trimmed = line.trim();
    if (!trimmed || /^,+$/.test(trimmed)) return [];
    const cells = trimmed.split(',').map((cell) => cell.trim());
    if (cells.length !== 9) throw new Error(`ردیف ${offset + 2}: باید ۹ ستون داشته باشد`);
    const [subject, grade, major, chapterTitle, chapterNo, topicTitle, topicNo, pageStart, pageEnd] = cells;
    const chapterNumber = Number(chapterNo);
    const topicNumber = Number(topicNo);
    if (!subject || !grade || !major || !chapterTitle || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
      throw new Error(`ردیف ${offset + 2}: داده اجباری نامعتبر است`);
    }
    if (topicTitle && (!Number.isInteger(topicNumber) || topicNumber < 1)) {
      throw new Error(`ردیف ${offset + 2}: topicNo نامعتبر است`);
    }
    return [{ subject, grade, major, chapterTitle, chapterNo: chapterNumber, topicTitle: topicTitle || null, topicNo: topicTitle ? topicNumber : null, pageStart: intOrNull(pageStart), pageEnd: intOrNull(pageEnd) }];
  });
}

async function main() {
  const rows = (await Promise.all(CSV_PATHS.map((file) => fs.readFile(file, 'utf8')))).flatMap(parse);
  const chapterBounds = new Map<string, { pageStart: number | null; pageEnd: number | null }>();
  for (const row of rows) {
    const key = `${row.subject}|${row.grade}|${row.major}|${row.chapterNo}`;
    const previous = chapterBounds.get(key);
    chapterBounds.set(key, {
      pageStart: row.pageStart === null ? previous?.pageStart ?? null : previous?.pageStart == null ? row.pageStart : Math.min(previous.pageStart, row.pageStart),
      pageEnd: row.pageEnd === null ? null : previous?.pageEnd == null ? row.pageEnd : Math.max(previous.pageEnd, row.pageEnd),
    });
  }
  const result = await db.$transaction(async (tx) => {
    const subjects = new Map<string, { id: string }>();
    const gradeSubjects = new Map<string, { id: string }>();
    const chapters = new Map<string, { id: string; pageStart: number | null; pageEnd: number | null }>();
    let createdSubjects = 0;
    let updatedSubjects = 0;
    let createdGradeSubjects = 0;
    let createdChapters = 0;
    let updatedChapters = 0;
    let createdTopics = 0;
    let updatedTopics = 0;

    for (const [sortOrder, name] of [...new Set(rows.map((row) => row.subject))].entries()) {
      const meta = META[name];
      if (!meta) throw new Error(`metadata درس «${name}» تعریف نشده است`);
      const normalizedName = normalizePersianText(name);
      const existing = await tx.subject.findUnique({ where: { normalizedName }, select: { id: true } });
      const subject = await tx.subject.upsert({
        where: { normalizedName },
        update: { name, color: meta.color, icon: meta.icon, sortOrder: sortOrder + 1, isKonkur: meta.isKonkur, isActive: true },
        create: { name, normalizedName, color: meta.color, icon: meta.icon, sortOrder: sortOrder + 1, isKonkur: meta.isKonkur, isActive: true },
        select: { id: true },
      });
      if (existing) updatedSubjects++; else createdSubjects++;
      subjects.set(name, subject);
    }

    for (const row of rows) {
      const subject = subjects.get(row.subject)!;
      const gradeKey = `${subject.id}|${row.grade}|${row.major}`;
      let gradeSubject = gradeSubjects.get(gradeKey);
      if (!gradeSubject) {
        const existing = await tx.gradeSubject.findUnique({ where: { subjectId_grade_major: { subjectId: subject.id, grade: row.grade, major: row.major } }, select: { id: true } });
        gradeSubject = await tx.gradeSubject.upsert({
          where: { subjectId_grade_major: { subjectId: subject.id, grade: row.grade, major: row.major } },
          update: { isActive: true },
          create: { subjectId: subject.id, grade: row.grade, major: row.major, sortOrder: gradeSubjects.size + 1, isActive: true },
          select: { id: true },
        });
        if (!existing) createdGradeSubjects++;
        gradeSubjects.set(gradeKey, gradeSubject);
      }

      const chapterKey = `${gradeSubject.id}|${row.chapterNo}`;
      const bounds = chapterBounds.get(`${row.subject}|${row.grade}|${row.major}|${row.chapterNo}`)!;
      let chapter = chapters.get(chapterKey);
      if (!chapter) {
        const existing = await tx.chapter.findUnique({ where: { gradeSubjectId_chapterNo: { gradeSubjectId: gradeSubject.id, chapterNo: row.chapterNo } }, select: { id: true } });
        chapter = await tx.chapter.upsert({
          where: { gradeSubjectId_chapterNo: { gradeSubjectId: gradeSubject.id, chapterNo: row.chapterNo } },
          update: { title: row.chapterTitle, pageStart: bounds.pageStart, pageEnd: bounds.pageEnd, isLastPage: bounds.pageEnd === null, sortOrder: row.chapterNo, isActive: true },
          create: { gradeSubjectId: gradeSubject.id, title: row.chapterTitle, chapterNo: row.chapterNo, pageStart: bounds.pageStart, pageEnd: bounds.pageEnd, isLastPage: bounds.pageEnd === null, sortOrder: row.chapterNo, isActive: true },
          select: { id: true, pageStart: true, pageEnd: true },
        });
        if (existing) updatedChapters++; else createdChapters++;
        chapters.set(chapterKey, chapter);
      }

      if (row.topicTitle && row.topicNo !== null) {
        const existing = await tx.topic.findUnique({ where: { chapterId_topicNo: { chapterId: chapter.id, topicNo: row.topicNo } }, select: { id: true } });
        const topic = await tx.topic.upsert({
          where: { chapterId_topicNo: { chapterId: chapter.id, topicNo: row.topicNo } },
          update: { title: row.topicTitle, pageStart: row.pageStart, pageEnd: row.pageEnd, isLastPage: row.pageEnd === null, sortOrder: row.topicNo, isActive: true },
          create: { chapterId: chapter.id, title: row.topicTitle, topicNo: row.topicNo, pageStart: row.pageStart, pageEnd: row.pageEnd, isLastPage: row.pageEnd === null, sortOrder: row.topicNo, isActive: true },
          select: { id: true },
        });
        if (existing) updatedTopics++; else createdTopics++;
        await tx.task.updateMany({ where: { topicId: topic.id }, data: { subject: row.subject, subjectColor: META[row.subject].color, topic: row.topicTitle } });
      }
    }

    for (const subject of subjects.values()) {
      const current = await tx.subject.findUniqueOrThrow({ where: { id: subject.id }, select: { name: true, color: true } });
      await tx.task.updateMany({ where: { subjectId: subject.id }, data: { subject: current.name, subjectColor: current.color } });
    }
    return { createdSubjects, updatedSubjects, createdGradeSubjects, createdChapters, updatedChapters, createdTopics, updatedTopics };
  });
  console.log('Non-destructive curriculum sync completed:', result);
}

main().catch((error) => { console.error('Curriculum sync failed:', error); process.exitCode = 1; }).finally(() => db.$disconnect());
