/**
 * Reval (روال) — Subjects Tree Seed
 *
 * Seeds the Subject / GradeSubject / Chapter / Topic / TopicMode tables
 * for the Experimental Sciences (تجربی) track:
 *   - زیست‌شناسی  (Biology)    — depth 3, both display modes
 *   - فیزیک       (Physics)     — depth 2, both display modes, optional subtopic field
 *   - شیمی        (Chemistry)   — depth 2, both display modes
 *   - ریاضی       (Math)        — depth 2, both display modes
 *   - زمین‌شناسی   (Geology)     — depth 1, یازدهم only, both display modes
 *
 * Run: bun run prisma/seed-subjects.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Helpers
// ============================================================
async function upsertSubject(input: {
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  assessmentType: string;
  displayStrategy: string;
  category: string;
  finalStrategy?: string;
}) {
  return prisma.subject.upsert({
    where: { name: input.name },
    update: {
      color: input.color,
      icon: input.icon,
      sortOrder: input.sortOrder,
      assessmentType: input.assessmentType,
      displayStrategy: input.displayStrategy,
      category: input.category,
      finalStrategy: input.finalStrategy ?? 'default',
      isActive: true,
    },
    create: {
      name: input.name,
      color: input.color,
      icon: input.icon,
      sortOrder: input.sortOrder,
      assessmentType: input.assessmentType,
      displayStrategy: input.displayStrategy,
      category: input.category,
      finalStrategy: input.finalStrategy ?? 'default',
      isActive: true,
    },
  });
}

async function upsertGradeSubject(subjectId: string, grade: string, major: string, depth: number, allowOptionalSubtopic: boolean, sortOrder: number) {
  return prisma.gradeSubject.upsert({
    where: { subjectId_grade_major: { subjectId, grade, major } },
    update: { depth, allowOptionalSubtopic, sortOrder, isActive: true },
    create: { subjectId, grade, major, depth, allowOptionalSubtopic, sortOrder, isActive: true },
  });
}

async function upsertChapter(subjectId: string, grade: string, chapterNo: number, title: string) {
  // find-or-create by unique [subjectId, grade, chapterNo]
  const existing = await prisma.chapter.findUnique({
    where: { subjectId_grade_chapterNo: { subjectId, grade, chapterNo } },
  });
  if (existing) {
    return prisma.chapter.update({
      where: { id: existing.id },
      data: { title, chapterNo, sortOrder: chapterNo, isActive: true },
    });
  }
  return prisma.chapter.create({
    data: { subjectId, grade, chapterNo, title, sortOrder: chapterNo, isActive: true },
  });
}

async function upsertTopic(chapterId: string, topicNo: number, title: string) {
  const existing = await prisma.topic.findUnique({
    where: { chapterId_topicNo: { chapterId, topicNo } },
  });
  if (existing) {
    return prisma.topic.update({
      where: { id: existing.id },
      data: { title, topicNo, sortOrder: topicNo, isActive: true },
    });
  }
  return prisma.topic.create({
    data: { chapterId, topicNo, title, sortOrder: topicNo, isActive: true },
  });
}

async function upsertTopicMode(subjectId: string, modeNo: number, title: string, description?: string) {
  const existing = await prisma.topicMode.findUnique({
    where: { subjectId_modeNo: { subjectId, modeNo } },
  });
  if (existing) {
    return prisma.topicMode.update({
      where: { id: existing.id },
      data: { title, description, modeNo, sortOrder: modeNo, isActive: true },
    });
  }
  return prisma.topicMode.create({
    data: { subjectId, modeNo, title, description, sortOrder: modeNo, isActive: true },
  });
}

// Bulk-add chapters with topics in one go
async function addChapterWithTopics(subjectId: string, grade: string, chapterNo: number, chapterTitle: string, topics?: string[]) {
  const chapter = await upsertChapter(subjectId, grade, chapterNo, chapterTitle);
  if (topics && topics.length > 0) {
    for (let i = 0; i < topics.length; i++) {
      await upsertTopic(chapter.id, i + 1, topics[i]);
    }
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🌱 Seeding Subjects tree (تجربی track)...\n');

  // ============================================================
  // 1) زیست‌شناسی (Biology) — depth 3, both display modes
  // ============================================================
  const biology = await upsertSubject({
    name: 'زیست‌شناسی',
    color: '#8B5CF6',
    icon: '🧬',
    sortOrder: 1,
    assessmentType: 'کنکور',
    displayStrategy: 'both',
    category: 'اختصاصی',
  });
  console.log('✅ زیست‌شناسی created');

  // Grades for biology: دهم/یازدهم/دوازدهم in تجربی — depth 3 (chapter + topic)
  await upsertGradeSubject(biology.id, 'دهم', 'تجربی', 3, false, 1);
  await upsertGradeSubject(biology.id, 'یازدهم', 'تجربی', 3, false, 2);
  await upsertGradeSubject(biology.id, 'دوازدهم', 'تجربی', 3, false, 3);

  // ----- Biology Grade 10 -----
  const bio10: [string, string[]?][] = [
    ['فصل ۱: دنیای زنده', ['زیست‌شناسی چیست؟', 'گستره حیات', 'یاخته و بافت در زیست‌شناسی']],
    ['فصل ۲: گوارش و جذب مواد', ['ساختار و عملکرد لوله گوارش', 'جذب مواد و تنظیم فعالیت لوله گوارش', 'تنوع گوارش در جانداران']],
    ['فصل ۳: تبادلات گازی', ['سازوکار دستگاه گردش خون در انسان', 'تهویه ششی', 'تنوع تبادلات گازی در جانداران']],
    ['فصل ۴: گردش مواد در بدن', ['قلب', 'رگ‌ها', 'خون', 'تنوع گردش مواد در جانداران']],
    ['فصل ۵: تنظیم اسمزی و دفع مواد زائد', ['همپیوستاری و کلیه‌ها', 'تشکیل ادرار و تخلیه آن', 'تنوع دفع و تنظیم اسمزی در جانداران']],
    ['فصل ۶: از یاخته تا گیاه', ['ویژگی‌های یاخته گیاهی', 'سامانه بافتی', 'ساختار گیاهان']],
    ['فصل ۷: جذب و انتقال مواد در گیاهان', ['تغذیه گیاهی', 'جابه‌جایی مواد در گیاهان']],
  ];
  for (let i = 0; i < bio10.length; i++) {
    await addChapterWithTopics(biology.id, 'دهم', i + 1, bio10[i][0], bio10[i][1]);
  }
  console.log('  • زیست دهم:', bio10.length, 'chapters');

  // ----- Biology Grade 11 -----
  const bio11: [string, string[]?][] = [
    ['فصل ۱: تنظیم عصبی', ['یاخته‌های بافت عصبی', 'ساختار دستگاه عصبی']],
    ['فصل ۲: حواس', ['گیرنده‌های حسی', 'حواس ویژه', 'گیرنده‌های حسی جانوران']],
    ['فصل ۳: حرکتی', ['استخوان‌ها و اسکلت', 'ماهیچه و حرکت', 'حرکت در جانوران']],
    ['فصل ۴: تنظیم شیمیایی', ['ارتباط شیمیایی', 'غدد درون‌ریز']],
    ['فصل ۵: ایمنی', ['خط نخست دفاعی', 'خط دوم دفاعی', 'خط سوم دفاعی']],
    ['فصل ۶: تقسیم یاخته', ['فام‌تن', 'راسمانی (میتوز)', 'کاستازی (میوز) و تولیدمثل جنسی']],
    ['فصل ۷: تولیدمثل', ['دستگاه تولیدمثل در مرد', 'دستگاه تولیدمثل در زن', 'رشد و نمو جنین', 'تولیدمثل در جانوران']],
    ['فصل ۸: تولیدمثل گیاهان', ['تولیدمثل غیرجنسی', 'تولیدمثل جنسی', 'از دانه تا درخت']],
    ['فصل ۹: پاسخ گیاهان به محرک‌ها', ['تنظیم‌کننده‌های رشد در گیاهان', 'پاسخ به محیط']],
  ];
  for (let i = 0; i < bio11.length; i++) {
    await addChapterWithTopics(biology.id, 'یازدهم', i + 1, bio11[i][0], bio11[i][1]);
  }
  console.log('  • زیست یازدهم:', bio11.length, 'chapters');

  // ----- Biology Grade 12 -----
  const bio12: [string, string[]?][] = [
    ['فصل ۱: مولکول‌های اطلاعاتی', ['نوکلئیک‌اسیدها', 'همسان‌سازی دنا', 'پروتئین‌ها']],
    ['فصل ۲: جریان اطلاعات در یاخته', ['رانویسی', 'به سوی پروتئین', 'تنظیم بیان ژن']],
    ['فصل ۳: انتقال اطلاعات در نسل‌ها', ['مفاهیم پایه', 'انواع وراثت']],
    ['فصل ۴: تغییر در اطلاعات وراثتی', ['تغییر در ماده وراثتی جانداران', 'تغییر در جمعیت‌ها', 'علت‌های تغییر در گونه‌ها']],
    ['فصل ۵: از ماده به انرژی', ['تامین انرژی', 'اکسایش قند', 'زیست‌نواختی']],
    ['فصل ۶: از انرژی به ماده', ['فتوسنتز', 'واکنش‌های فتوسنتزی', 'فتوسنتز در شرایط مختلف']],
    ['فصل ۷: فناوری‌های جدید زیستی', ['زیست‌فناوری و مهندسی ژنتیک', 'فناوری مهندسی پروتئین و بافت', 'کاربردهای زیست‌فناوری']],
    ['فصل ۸: رفتارهای جانوران', ['اساس رفتار', 'انتخاب طبیعی و رفتار', 'ارتباط بین جانوران']],
  ];
  for (let i = 0; i < bio12.length; i++) {
    await addChapterWithTopics(biology.id, 'دوازدهم', i + 1, bio12[i][0], bio12[i][1]);
  }
  console.log('  • زیست دوازدهم:', bio12.length, 'chapters');

  // ----- Biology Topic Modes (مبحثی) -----
  const bioTopicModes: [string, string?][] = [
    ['زیست سلولی و مولکولی', 'مولکول‌های زیستی، ساختار یاخته، دنا، رنا، پروتئین‌سازی و زیست‌فناوری'],
    ['ژنتیک و تقسیم یاخته', 'میتوز، میوز، ژنتیک مندلی، وراثت و تغییر در اطلاعات وراثتی'],
    ['زیست انسانی و جانوری', 'گوارش، تنفس، گردش مواد، دفع، حرکت، عصبی، حواس، ایمنی، هورمون و تولیدمثل'],
    ['زیست گیاهی', 'بافت گیاهی، تغذیه و انتقال مواد، تولیدمثل گیاهی و تنظیم‌کننده‌های رشد'],
    ['شارش انرژی', 'از ماده به انرژی - تنفس سلولی / از انرژی به ماده - فتوسنتز'],
    ['تکامل و رفتارهای جانوران', 'تغییر در گونه‌ها و زیست‌شناسی رفتار'],
  ];
  for (let i = 0; i < bioTopicModes.length; i++) {
    await upsertTopicMode(biology.id, i + 1, bioTopicModes[i][0], bioTopicModes[i][1]);
  }
  console.log('  • زیست مبحثی:', bioTopicModes.length, 'topic modes');

  // ============================================================
  // 2) فیزیک (Physics) — depth 2, optional subtopic text field, both modes
  // ============================================================
  const physics = await upsertSubject({
    name: 'فیزیک',
    color: '#F59E0B',
    icon: '⚛️',
    sortOrder: 2,
    assessmentType: 'کنکور',
    displayStrategy: 'both',
    category: 'اختصاصی',
  });
  console.log('✅ فیزیک created');

  // Physics grades: depth 2, allowOptionalSubtopic = true
  await upsertGradeSubject(physics.id, 'دهم', 'تجربی', 2, true, 1);
  await upsertGradeSubject(physics.id, 'یازدهم', 'تجربی', 2, true, 2);
  await upsertGradeSubject(physics.id, 'دوازدهم', 'تجربی', 2, true, 3);

  // Physics chapters (no topics — depth 2)
  const physics10 = [
    'فصل ۱: فیزیک و اندازه گام',
    'فصل ۲: ویژگی‌های فیزیکی مواد',
    'فصل ۳: کار، انرژی و توان',
    'فصل ۴: دما و گرمایی',
  ];
  for (let i = 0; i < physics10.length; i++) {
    await upsertChapter(physics.id, 'دهم', i + 1, physics10[i]);
  }
  console.log('  • فیزیک دهم:', physics10.length, 'chapters');

  const physics11 = [
    'فصل ۱: الکتریسیته ساکن',
    'فصل ۲: جریان الکتریکی و مدارهای جریان مستقیم',
    'فصل ۳: مغناطیس و القای الکترومغناطیسی',
  ];
  for (let i = 0; i < physics11.length; i++) {
    await upsertChapter(physics.id, 'یازدهم', i + 1, physics11[i]);
  }
  console.log('  • فیزیک یازدهم:', physics11.length, 'chapters');

  const physics12 = [
    'فصل ۱: حرکت بر خط راست',
    'فصل ۲: دینامیک و حرکت دائره‌ای',
    'فصل ۳: نوسان و موج',
    'فصل ۴: آشنایی با فیزیک اتمی و هسته‌ای',
  ];
  for (let i = 0; i < physics12.length; i++) {
    await upsertChapter(physics.id, 'دوازدهم', i + 1, physics12[i]);
  }
  console.log('  • فیزیک دوازدهم:', physics12.length, 'chapters');

  // Physics Topic Modes (مبحثی)
  const physicsTopicModes = [
    'مکانیک (حرکت‌شناسی، دینامیک، کار و انرژی)',
    'نوسان، موج و فیزیک جدید (نوسان، موج، فیزیک اتمی و هسته‌ای)',
    'الکتریسیته (الکتریسیته ساکن، جریان الکتریکی و مدارها)',
    'مغناطیس و القا (میدان مغناطیسی و القای الکترومغناطیسی)',
    'خواص ماده، دما و گرمایی (اندازه‌گیری، ویژگی‌های فیزیکی مواد، دما و گرمایی)',
  ];
  for (let i = 0; i < physicsTopicModes.length; i++) {
    await upsertTopicMode(physics.id, i + 1, physicsTopicModes[i]);
  }
  console.log('  • فیزیک مبحثی:', physicsTopicModes.length, 'topic modes');

  // ============================================================
  // 3) شیمی (Chemistry) — depth 2, both modes
  // ============================================================
  const chemistry = await upsertSubject({
    name: 'شیمی',
    color: '#EF4444',
    icon: '⚗️',
    sortOrder: 3,
    assessmentType: 'کنکور',
    displayStrategy: 'both',
    category: 'اختصاصی',
  });
  console.log('✅ شیمی created');

  await upsertGradeSubject(chemistry.id, 'دهم', 'تجربی', 2, false, 1);
  await upsertGradeSubject(chemistry.id, 'یازدهم', 'تجربی', 2, false, 2);
  await upsertGradeSubject(chemistry.id, 'دوازدهم', 'تجربی', 2, false, 3);

  const chem10 = [
    'فصل ۱: کیهان زادگاه الفبای هستی',
    'فصل ۲: ردپای گازها در زندگی',
    'فصل ۳: آب، مایع زلال زندگی',
  ];
  for (let i = 0; i < chem10.length; i++) {
    await upsertChapter(chemistry.id, 'دهم', i + 1, chem10[i]);
  }
  console.log('  • شیمی دهم:', chem10.length, 'chapters');

  const chem11 = [
    'فصل ۱: قدر هدایای زمین را بدانیم',
    'فصل ۲: در پی غذای سالم',
    'فصل ۳: پوشاک، نیازی پایان‌ناپذیر',
  ];
  for (let i = 0; i < chem11.length; i++) {
    await upsertChapter(chemistry.id, 'یازدهم', i + 1, chem11[i]);
  }
  console.log('  • شیمی یازدهم:', chem11.length, 'chapters');

  const chem12 = [
    'فصل ۱: مولکول‌ها در خدمت سلامت',
    'فصل ۲: آسایش و رفاه در سایه شیمی',
    'فصل ۳: شیمی جلادهنده زندگی',
    'فصل ۴: شیمی، راهی به سوی آینده‌ای روشن‌تر',
  ];
  for (let i = 0; i < chem12.length; i++) {
    await upsertChapter(chemistry.id, 'دوازدهم', i + 1, chem12[i]);
  }
  console.log('  • شیمی دوازدهم:', chem12.length, 'chapters');

  // Chemistry Topic Modes (مبحثی)
  const chemTopicModes = [
    'مفاهیم اولیه، ساختار اتم و جدول تناوبی',
    'استوکیومتری و محاسبات عددی',
    'شیمی آلی و درشت‌مولکول‌ها',
    'ترمودینامیک، سینتیک و تعادل',
    'الکتروشیمی و شیمی صنعتی',
  ];
  for (let i = 0; i < chemTopicModes.length; i++) {
    await upsertTopicMode(chemistry.id, i + 1, chemTopicModes[i]);
  }
  console.log('  • شیمی مبحثی:', chemTopicModes.length, 'topic modes');

  // ============================================================
  // 4) ریاضی (Math) — depth 2, both modes
  // ============================================================
  const math = await upsertSubject({
    name: 'ریاضی',
    color: '#3EB489',
    icon: '📐',
    sortOrder: 4,
    assessmentType: 'کنکور',
    displayStrategy: 'both',
    category: 'اختصاصی',
  });
  console.log('✅ ریاضی created');

  await upsertGradeSubject(math.id, 'دهم', 'تجربی', 2, false, 1);
  await upsertGradeSubject(math.id, 'یازدهم', 'تجربی', 2, false, 2);
  await upsertGradeSubject(math.id, 'دوازدهم', 'تجربی', 2, false, 3);

  const math10 = [
    'فصل ۱: مجموعه، الگوی و دنباله',
    'فصل ۲: مثلثات',
    'فصل ۳: توان‌های رسانه‌ای و عبارات جبری',
    'فصل ۴: معادله‌ها و ناامعادله‌ها',
    'فصل ۵: تابع',
    'فصل ۶: شمارش، بدون شمارش',
    'فصل ۷: آمار و احتمال',
  ];
  for (let i = 0; i < math10.length; i++) {
    await upsertChapter(math.id, 'دهم', i + 1, math10[i]);
  }
  console.log('  • ریاضی دهم:', math10.length, 'chapters');

  const math11 = [
    'فصل ۱: هندسه تحلیلی و جبر',
    'فصل ۲: هندسه',
    'فصل ۳: تابع',
    'فصل ۴: مثلثات',
    'فصل ۵: توابع نمایی و لگاریتمی',
    'فصل ۶: حد و پیوستگی',
    'فصل ۷: آمار و احتمال',
  ];
  for (let i = 0; i < math11.length; i++) {
    await upsertChapter(math.id, 'یازدهم', i + 1, math11[i]);
  }
  console.log('  • ریاضی یازدهم:', math11.length, 'chapters');

  const math12 = [
    'فصل ۱: تابع',
    'فصل ۲: مثلثات',
    'فصل ۳: حد بی‌نهایت و حد در بی‌نهایت',
    'فصل ۴: مشتق',
    'فصل ۵: کاربرد مشتق',
    'فصل ۶: هندسه',
    'فصل ۷: احتمال',
  ];
  for (let i = 0; i < math12.length; i++) {
    await upsertChapter(math.id, 'دوازدهم', i + 1, math12[i]);
  }
  console.log('  • ریاضی دوازدهم:', math12.length, 'chapters');

  // Math Topic Modes (مبحثی)
  const mathTopicModes = [
    'تابع و انواع آن',
    'مثلثات',
    'حد، پیوستگی و میل به بی‌نهایت',
    'مشتق و کاربرد مشتق',
    'هندسه و مقاطع مخروطی',
    'آمار و احتمال',
    'معادلات، نامعادلات و جبر',
  ];
  for (let i = 0; i < mathTopicModes.length; i++) {
    await upsertTopicMode(math.id, i + 1, mathTopicModes[i]);
  }
  console.log('  • ریاضی مبحثی:', mathTopicModes.length, 'topic modes');

  // ============================================================
  // 5) زمین‌شناسی (Geology) — depth 1, یازدهم only, both modes
  // ============================================================
  const geology = await upsertSubject({
    name: 'زمین‌شناسی',
    color: '#A16207',
    icon: '🪨',
    sortOrder: 5,
    assessmentType: 'کنکور',
    displayStrategy: 'both',
    category: 'اختصاصی',
  });
  console.log('✅ زمین‌شناسی created');

  // Geology applies to یازدهم for both تجربی and ریاضی
  await upsertGradeSubject(geology.id, 'یازدهم', 'تجربی', 1, false, 1);
  await upsertGradeSubject(geology.id, 'یازدهم', 'ریاضی', 1, false, 2);

  const geology11 = [
    'فصل ۱: آفرینش کیهان و تکوین زمین',
    'فصل ۲: منابع معدنی و ذخایر انرژی زیربنای تمدن و توسعه',
    'فصل ۳: منابع آب و خاک',
    'فصل ۴: پویایی زمین',
    'فصل ۵: زمین‌شناسی و سلامت',
    'فصل ۶: زمین‌شناسی و سازه‌های مهندسی',
    'فصل ۷: زمین‌شناسی ایران',
  ];
  for (let i = 0; i < geology11.length; i++) {
    await upsertChapter(geology.id, 'یازدهم', i + 1, geology11[i]);
  }
  console.log('  • زمین‌شناسی یازدهم:', geology11.length, 'chapters');

  // Geology Topic Modes (مبحثی)
  const geologyTopicModes = [
    'کیهان، تکوین زمین و زمان زمین‌شناسی',
    'منابع معدنی، کانی‌ها و سوخت‌های فسیلی',
    'منابع آب، خاک و فرسایش',
    'پویایی زمین، تکتونیک و مخاطرات طبیعی',
    'زمین‌شناسی کاربردی: سلامت، سازه‌ها و ایران',
  ];
  for (let i = 0; i < geologyTopicModes.length; i++) {
    await upsertTopicMode(geology.id, i + 1, geologyTopicModes[i]);
  }
  console.log('  • زمین‌شناسی مبحثی:', geologyTopicModes.length, 'topic modes');

  // ============================================================
  // Summary
  // ============================================================
  const stats = await Promise.all([
    prisma.subject.count(),
    prisma.gradeSubject.count(),
    prisma.chapter.count(),
    prisma.topic.count(),
    prisma.topicMode.count(),
  ]);
  console.log('\n🎉 Subjects seed complete!');
  console.log(`   📚 Subjects:     ${stats[0]}`);
  console.log(`   🎓 Grade links: ${stats[1]}`);
  console.log(`   📖 Chapters:    ${stats[2]}`);
  console.log(`   💬 Topics:      ${stats[3]}`);
  console.log(`   🔀 Topic modes: ${stats[4]}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
