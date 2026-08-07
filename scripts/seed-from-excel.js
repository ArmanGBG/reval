/**
 * Seed script: Reads Title Reval.xlsx and populates the database with
 * Subject → GradeSubject → Chapter → Topic hierarchy.
 *
 * Usage: node scripts/seed-from-excel.js
 *
 * It will:
 *  1. Delete ALL existing curriculum data (Topic, Chapter, GradeSubject, TopicMode, Subject)
 *  2. Parse each sheet in the Excel file
 *  3. Determine subject name, grade, major from the sheet name
 *  4. Create Subject (if not already created), GradeSubject, Chapters, Topics
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// ===== Configuration =====
const EXCEL_PATH = '/home/z/my-project/upload/Title Reval.xlsx';

// Subject definitions with metadata
const SUBJECT_CONFIG = {
  'زیست‌شناسی': { color: '#8B5CF6', icon: '🧬', isKonkur: true, sortOrder: 1 },
  'فیزیک':      { color: '#F59E0B', icon: '⚛️', isKonkur: true, sortOrder: 2 },
  'شیمی':       { color: '#EF4444', icon: '🧪', isKonkur: true, sortOrder: 3 },
  'ریاضی':      { color: '#3EB489', icon: '📐', isKonkur: true, sortOrder: 4 },
};

/**
 * Parse sheet name to extract subject name, grade, and major.
 * Sheet names follow patterns like:
 *   "زیست دهم"          → زیست‌شناسی, دهم, تجربی
 *   "فیزیک یازدهم تجربی" → فیزیک, یازدهم, تجربی
 *   "ریاضی دهم تجربی"    → ریاضی, دهم, تجربی
 *   "شیمی دوازدهم تجربی" → شیمی, دوازدهم, تجربی
 */
function parseSheetName(sheetName) {
  // Check for Sheet11 specially (ریاضی دوازدهم تجربی)
  if (sheetName === 'Sheet11') {
    return { subjectName: 'ریاضی', grade: 'دوازدهم', major: 'تجربی' };
  }

  // Known grade keywords - CHECK LONGEST FIRST to avoid "دهم" matching inside "یازدهم"/"دوازدهم"
  const grades = ['دوازدهم', 'یازدهم', 'دهم'];
  // Known major keywords
  const majors = ['تجربی', 'ریاضی', 'انسانی'];

  let grade = null;
  let major = 'تجربی'; // default
  let subjectKey = null;

  // Extract grade - use word boundary approach
  for (const g of grades) {
    // Match grade only if it appears as a complete word (preceded by space or start)
    const regex = new RegExp('(^|\\s)' + g + '(\\s|$)');
    if (regex.test(sheetName)) {
      grade = g;
      break;
    }
  }

  // Extract major
  for (const m of majors) {
    if (sheetName.includes(m)) {
      major = m;
      break;
    }
  }

  // Determine subject from remaining text
  let remaining = sheetName;
  if (grade) remaining = remaining.replace(grade, '').trim();
  if (major !== 'تجربی') remaining = remaining.replace(major, '').trim();
  // Also remove default major if explicitly present
  remaining = remaining.replace('تجربی', '').trim();

  // Map sheet name prefix to canonical subject name
  const subjectMap = {
    'زیست': 'زیست‌شناسی',
    'زیست‌شناسی': 'زیست‌شناسی',
    'فیزیک': 'فیزیک',
    'شیمی': 'شیمی',
    'ریاضی': 'ریاضی',
  };

  subjectKey = subjectMap[remaining] || null;

  if (!subjectKey || !grade) {
    console.warn(`  ⚠️ Could not parse sheet "${sheetName}" → remaining="${remaining}", subjectKey="${subjectKey}", grade="${grade}"`);
    return null;
  }

  return { subjectName: subjectKey, grade, major };
}

/**
 * Normalize Persian text for deduplication.
 * Replaces Arabic Yeh/Kaf with Persian forms, collapses whitespace.
 */
function normalizePersian(str) {
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Convert Persian/Arabic numeral strings to integer.
 */
function persianToInt(val) {
  if (val == null) return null;
  const str = String(val).trim();
  if (!str) return null;

  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  let result = '';
  for (const ch of str) {
    const pIdx = persianDigits.indexOf(ch);
    if (pIdx >= 0) { result += pIdx; continue; }
    const aIdx = arabicDigits.indexOf(ch);
    if (aIdx >= 0) { result += aIdx; continue; }
    result += ch;
  }

  const num = parseInt(result, 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse a sheet into chapters and topics.
 * Handles three formats:
 *   1. نام فصل | نام گفتار | از صفحه | تا صفحه  (biology, physics)
 *   2. نام فصل | عنوان درس | از صفحه | تا صفحه  (physics alt)
 *   3. نام فصل | از صفحه | تا صفحه              (chemistry - no topics)
 *   4. نام فصل | نام درس | از صفحه | تا صفحه    (math)
 *   5. نام فصل | نام درس / بخش | از صفحه | تا صفحه (math 12th)
 */
function parseSheet(sheetName, worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  // Find the header row (first row with "نام فصل")
  let headerRowIndex = -1;
  let headerCols = [];
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if (row && row.some(cell => cell && String(cell).includes('نام فصل'))) {
      headerRowIndex = i;
      headerCols = row.map(c => c ? String(c).trim() : '');
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn(`  ⚠️ No header row found in sheet "${sheetName}"`);
    return [];
  }

  // Determine column indices
  const chapterCol = headerCols.findIndex(c => c.includes('نام فصل'));
  // Topic column could be "نام گفتار", "عنوان درس", "نام درس", "نام درس / بخش"
  const topicCol = headerCols.findIndex(c =>
    c.includes('نام گفتار') || c.includes('عنوان درس') || c.includes('نام درس')
  );
  const startPageCol = headerCols.findIndex(c => c.includes('از صفحه'));
  const endPageCol = headerCols.findIndex(c => c.includes('تا صفحه'));

  if (chapterCol === -1 || startPageCol === -1 || endPageCol === -1) {
    console.warn(`  ⚠️ Missing required columns in sheet "${sheetName}": headerCols=${JSON.stringify(headerCols)}`);
    return [];
  }

  const hasTopics = topicCol !== -1;

  // Parse data rows
  const chapters = [];
  let currentChapter = null;

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every(c => c == null)) continue;

    const chapterTitle = row[chapterCol] ? String(row[chapterCol]).trim() : null;
    const topicTitle = hasTopics && row[topicCol] ? String(row[topicCol]).trim() : null;
    const startPage = persianToInt(row[startPageCol]);
    const endPage = persianToInt(row[endPageCol]);

    // New chapter found
    if (chapterTitle) {
      currentChapter = {
        title: chapterTitle,
        pageStart: startPage,
        pageEnd: endPage,
        topics: [],
      };
      chapters.push(currentChapter);
    }

    // Topic found (either with or without a chapter header on same row)
    if (topicTitle && currentChapter) {
      currentChapter.topics.push({
        title: topicTitle,
        pageStart: startPage,
        pageEnd: endPage,
      });
    }
  }

  return chapters;
}

async function main() {
  console.log('📖 Reading Excel file:', EXCEL_PATH);
  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log('  Sheets:', workbook.SheetNames.join(', '));

  // ===== Step 1: Delete all existing curriculum data =====
  console.log('\n🗑️ Deleting all existing curriculum data...');

  // Delete in order respecting foreign key constraints
  const deletedTasks = await prisma.task.deleteMany({});
  console.log(`  Deleted ${deletedTasks.count} tasks`);

  const deletedTopics = await prisma.topic.deleteMany({});
  console.log(`  Deleted ${deletedTopics.count} topics`);

  const deletedChapters = await prisma.chapter.deleteMany({});
  console.log(`  Deleted ${deletedChapters.count} chapters`);

  const deletedTopicModes = await prisma.topicMode.deleteMany({});
  console.log(`  Deleted ${deletedTopicModes.count} topic modes`);

  const deletedGradeSubjects = await prisma.gradeSubject.deleteMany({});
  console.log(`  Deleted ${deletedGradeSubjects.count} grade subjects`);

  const deletedSubjects = await prisma.subject.deleteMany({});
  console.log(`  Deleted ${deletedSubjects.count} subjects`);

  // ===== Step 2: Parse Excel and create data =====
  console.log('\n🌱 Seeding new data from Excel...');

  // Track created subjects to avoid duplicates
  const createdSubjects = {};

  // Skip sheets that are not curriculum data
  const skipSheets = ['Sheet11']; // We'll handle Sheet11 manually if needed

  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📋 Processing sheet: "${sheetName}"`);

    const parsed = parseSheetName(sheetName);
    if (!parsed) {
      console.log('  ⏭️ Skipped (could not parse sheet name)');
      continue;
    }

    const { subjectName, grade, major } = parsed;
    console.log(`  → Subject: ${subjectName}, Grade: ${grade}, Major: ${major}`);

    // Create subject if not exists
    if (!createdSubjects[subjectName]) {
      const config = SUBJECT_CONFIG[subjectName] || { color: '#3EB489', icon: '📚', isKonkur: false, sortOrder: 0 };
      const subject = await prisma.subject.create({
        data: {
          name: subjectName,
          normalizedName: normalizePersian(subjectName),
          color: config.color,
          icon: config.icon,
          isKonkur: config.isKonkur,
          sortOrder: config.sortOrder,
          isActive: true,
        },
      });
      createdSubjects[subjectName] = subject;
      console.log(`  ✅ Created subject: ${subjectName} (id: ${subject.id})`);
    }

    const subject = createdSubjects[subjectName];

    // Create GradeSubject
    const gradeSubject = await prisma.gradeSubject.create({
      data: {
        subjectId: subject.id,
        grade: grade,
        major: major,
        sortOrder: gradesSortOrder(grade),
        isActive: true,
      },
    });
    console.log(`  ✅ Created GradeSubject: ${grade} ${major} (id: ${gradeSubject.id})`);

    // Parse sheet data
    const worksheet = workbook.Sheets[sheetName];
    const chapters = parseSheet(sheetName, worksheet);

    if (chapters.length === 0) {
      console.log('  ⚠️ No chapters found in this sheet');
      continue;
    }

    // Create chapters and topics
    for (let chIdx = 0; chIdx < chapters.length; chIdx++) {
      const ch = chapters[chIdx];
      const chapterNo = chIdx + 1;

      const chapter = await prisma.chapter.create({
        data: {
          gradeSubjectId: gradeSubject.id,
          title: ch.title,
          chapterNo: chapterNo,
          pageStart: ch.pageStart,
          pageEnd: ch.pageEnd,
          sortOrder: chapterNo,
          isActive: true,
        },
      });

      // Create topics
      for (let tIdx = 0; tIdx < ch.topics.length; tIdx++) {
        const tp = ch.topics[tIdx];
        const topicNo = tIdx + 1;

        await prisma.topic.create({
          data: {
            chapterId: chapter.id,
            title: tp.title,
            topicNo: topicNo,
            pageStart: tp.pageStart,
            pageEnd: tp.pageEnd,
            sortOrder: topicNo,
            isActive: true,
          },
        });
      }

      console.log(`    📖 Ch${chapterNo}: ${ch.title} (${ch.topics.length} topics)`);
    }
  }

  // ===== Step 3: Summary =====
  console.log('\n========== Seed Summary ==========');
  const allSubjects = await prisma.subject.findMany({
    include: {
      grades: {
        include: {
          chapters: {
            include: { topics: true },
            orderBy: { chapterNo: 'asc' },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  for (const s of allSubjects) {
    console.log(`\n📘 ${s.name} (${s.icon}) - color: ${s.color}, isKonkur: ${s.isKonkur}`);
    for (const gs of s.grades) {
      const totalTopics = gs.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
      console.log(`  📗 ${gs.grade} ${gs.major}: ${gs.chapters.length} chapters, ${totalTopics} topics`);
    }
  }

  console.log('\n✅ Seed complete!');
}

function gradesSortOrder(grade) {
  const order = { 'دهم': 1, 'یازدهم': 2, 'دوازدهم': 3 };
  return order[grade] || 0;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
