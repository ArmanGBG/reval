/**
 * Reval (روال) — Subjects Tree Seed (NEW SCHEMA)
 *
 * Seeds Subject / GradeSubject / Chapter / Topic / TopicMode for the
 * کنکور تجربی track. All 5 subjects are isKonkur=true.
 *
 * Schema notes:
 *   - Subject has only: name, color, icon, sortOrder, isKonkur, isActive.
 *     (assessmentType / displayStrategy / category / finalStrategy removed.)
 *   - GradeSubject has: subjectId, grade, major, sortOrder, isActive.
 *     (depth / allowOptionalSubtopic removed.)
 *   - Chapter belongs to GradeSubject (gradeSubjectId), has pageStart /
 *     pageEnd / isLastPage. Last chapter per gradeSubject has pageEnd=null +
 *     isLastPage=true ("تا پایان کتاب").
 *   - Topic belongs to Chapter, has pageStart / pageEnd / isLastPage.
 *   - TopicMode belongs to Subject. Biology topic modes were intentionally
 *     removed in task 9 → NOT recreated here.
 *
 * Valid grades:  دهم | یازدهم | دوازدهم  (no فارغ‌التحصیل)
 * Valid majors:  تجربی | ریاضی | انسانی  (no همه)
 *
 * Run: bun run prisma/seed-subjects.ts
 */
import { db } from '../src/lib/db';
import { normalizePersianText } from '../src/lib/validators/normalize';

type ChapterSpec = { title: string; topics?: string[] };
type GradeSpec = {
  grade: 'دهم' | 'یازدهم' | 'دوازدهم';
  major: 'تجربی' | 'ریاضی' | 'انسانی';
  chapters: ChapterSpec[];
};

// ============================================================
// Page-range helpers
// ============================================================
const PAGES_PER_CHAPTER = 25;
const PAGES_PER_TOPIC = 8;

/** Build pageStart/pageEnd/isLastPage for the chapter at position `index`. */
function chapterPageRange(
  index: number,
  total: number,
): { pageStart: number; pageEnd: number | null; isLastPage: boolean } {
  const pageStart = 1 + PAGES_PER_CHAPTER * index;
  if (index === total - 1) {
    return { pageStart, pageEnd: null, isLastPage: true };
  }
  return { pageStart, pageEnd: pageStart + PAGES_PER_CHAPTER - 1, isLastPage: false };
}

/** Distribute topic sub-ranges within a chapter's [pageStart, pageEnd] range. */
function topicPageRanges(
  chapterPageStart: number,
  chapterPageEnd: number | null,
  topicCount: number,
): Array<{ pageStart: number; pageEnd: number | null; isLastPage: boolean }> {
  if (topicCount === 0) return [];
  const out: Array<{ pageStart: number; pageEnd: number | null; isLastPage: boolean }> = [];
  let cursor = chapterPageStart;
  for (let i = 0; i < topicCount; i++) {
    const isLast = i === topicCount - 1;
    if (isLast) {
      // Last topic extends to chapter's end (or open-ended if chapter is open-ended).
      out.push({
        pageStart: cursor,
        pageEnd: chapterPageEnd,
        isLastPage: chapterPageEnd === null, // open-ended chapter → open-ended topic
      });
    } else {
      out.push({ pageStart: cursor, pageEnd: cursor + PAGES_PER_TOPIC - 1, isLastPage: false });
      cursor += PAGES_PER_TOPIC;
    }
  }
  // If chapter has a closed pageEnd and topics don't reach it (perTopic too small),
  // stretch the last topic's pageEnd to the chapter's pageEnd so the entire
  // chapter range is covered by its topics.
  if (chapterPageEnd !== null) {
    out[topicCount - 1].pageEnd = chapterPageEnd;
    out[topicCount - 1].isLastPage = false;
  }
  return out;
}

// ============================================================
// Idempotent seed for a single subject
// ============================================================
async function seedSubjectTree(input: {
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  grades: GradeSpec[];
  topicModes?: Array<{ title: string; description?: string }>;
}) {
  const subject = await db.subject.upsert({
    where: { name: input.name },
    update: {
      color: input.color,
      icon: input.icon,
      sortOrder: input.sortOrder,
      isKonkur: true,
      isActive: true,
      normalizedName: normalizePersianText(input.name),
    },
    create: {
      name: input.name,
      normalizedName: normalizePersianText(input.name),
      color: input.color,
      icon: input.icon,
      sortOrder: input.sortOrder,
      isKonkur: true,
      isActive: true,
    },
  });

  // Wipe existing children — they will be recreated (idempotent seed).
  // GradeSubject cascades to Chapter → Topic, so just delete gradeSubjects.
  await db.gradeSubject.deleteMany({ where: { subjectId: subject.id } });
  // TopicModes belong directly to subject.
  await db.topicMode.deleteMany({ where: { subjectId: subject.id } });

  for (let gIdx = 0; gIdx < input.grades.length; gIdx++) {
    const g = input.grades[gIdx];
    const gradeSubject = await db.gradeSubject.create({
      data: {
        subjectId: subject.id,
        grade: g.grade,
        major: g.major,
        sortOrder: gIdx + 1,
        isActive: true,
      },
    });

    const totalChapters = g.chapters.length;
    for (let i = 0; i < totalChapters; i++) {
      const spec = g.chapters[i];
      const page = chapterPageRange(i, totalChapters);
      const chapter = await db.chapter.create({
        data: {
          gradeSubjectId: gradeSubject.id,
          title: spec.title,
          chapterNo: i + 1,
          pageStart: page.pageStart,
          pageEnd: page.pageEnd,
          isLastPage: page.isLastPage,
          sortOrder: i + 1,
          isActive: true,
        },
      });

      const topics = spec.topics ?? [];
      const ranges = topicPageRanges(page.pageStart, page.pageEnd, topics.length);
      for (let j = 0; j < topics.length; j++) {
        await db.topic.create({
          data: {
            chapterId: chapter.id,
            title: topics[j],
            topicNo: j + 1,
            pageStart: ranges[j].pageStart,
            pageEnd: ranges[j].pageEnd,
            isLastPage: ranges[j].isLastPage,
            sortOrder: j + 1,
            isActive: true,
          },
        });
      }
    }
    console.log(
      `  • ${input.name} ${g.grade}/${g.major}: ${totalChapters} chapters`,
    );
  }

  if (input.topicModes && input.topicModes.length > 0) {
    for (let i = 0; i < input.topicModes.length; i++) {
      const m = input.topicModes[i];
      await db.topicMode.create({
        data: {
          subjectId: subject.id,
          title: m.title,
          description: m.description ?? null,
          modeNo: i + 1,
          sortOrder: i + 1,
          isActive: true,
        },
      });
    }
    console.log(
      `  • ${input.name} مباحث: ${input.topicModes.length} topic modes`,
    );
  }

  return subject;
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🌱 Seeding Subjects tree (new schema)...\n');

  // ----- 1) زیست‌شناسی (Biology) -----
  // کنکور تجربی, depth-3 chapters-with-topics, NO topic modes (removed in task 9).
  await seedSubjectTree({
    name: 'زیست‌شناسی',
    color: '#8B5CF6',
    icon: '🧬',
    sortOrder: 1,
    grades: [
      {
        grade: 'دهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: دنیای زنده', topics: ['زیست‌شناسی چیست؟', 'گستره حیات', 'یاخته و بافت در زیست‌شناسی'] },
          { title: 'فصل ۲: گوارش و جذب مواد', topics: ['ساختار و عملکرد لوله گوارش', 'جذب مواد و تنظیم فعالیت لوله گوارش', 'تنوع گوارش در جانداران'] },
          { title: 'فصل ۳: تبادلات گازی', topics: ['سازوکار دستگاه گردش خون در انسان', 'تهویه ششی', 'تنوع تبادلات گازی در جانداران'] },
          { title: 'فصل ۴: گردش مواد در بدن', topics: ['قلب', 'رگ‌ها', 'خون', 'تنوع گردش مواد در جانداران'] },
          { title: 'فصل ۵: تنظیم اسمزی و دفع مواد زائد', topics: ['همپیوستاری و کلیه‌ها', 'تشکیل ادرار و تخلیه آن', 'تنوع دفع و تنظیم اسمزی در جانداران'] },
          { title: 'فصل ۶: از یاخته تا گیاه', topics: ['ویژگی‌های یاخته گیاهی', 'سامانه بافتی', 'ساختار گیاهان'] },
          { title: 'فصل ۷: جذب و انتقال مواد در گیاهان', topics: ['تغذیه گیاهی', 'جابه‌جایی مواد در گیاهان'] },
        ],
      },
      {
        grade: 'یازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: تنظیم عصبی', topics: ['یاخته‌های بافت عصبی', 'ساختار دستگاه عصبی'] },
          { title: 'فصل ۲: حواس', topics: ['گیرنده‌های حسی', 'حواس ویژه', 'گیرنده‌های حسی جانوران'] },
          { title: 'فصل ۳: حرکتی', topics: ['استخوان‌ها و اسکلت', 'ماهیچه و حرکت', 'حرکت در جانوران'] },
          { title: 'فصل ۴: تنظیم شیمیایی', topics: ['ارتباط شیمیایی', 'غدد درون‌ریز'] },
          { title: 'فصل ۵: ایمنی', topics: ['خط نخست دفاعی', 'خط دوم دفاعی', 'خط سوم دفاعی'] },
          { title: 'فصل ۶: تقسیم یاخته', topics: ['فام‌تن', 'راسمانی (میتوز)', 'کاستازی (میوز) و تولیدمثل جنسی'] },
          { title: 'فصل ۷: تولیدمثل', topics: ['دستگاه تولیدمثل در مرد', 'دستگاه تولیدمثل در زن', 'رشد و نمو جنین', 'تولیدمثل در جانوران'] },
          { title: 'فصل ۸: تولیدمثل گیاهان', topics: ['تولیدمثل غیرجنسی', 'تولیدمثل جنسی', 'از دانه تا درخت'] },
          { title: 'فصل ۹: پاسخ گیاهان به محرک‌ها', topics: ['تنظیم‌کننده‌های رشد در گیاهان', 'پاسخ به محیط'] },
        ],
      },
      {
        grade: 'دوازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: مولکول‌های اطلاعاتی', topics: ['نوکلئیک‌اسیدها', 'همسان‌سازی دنا', 'پروتئین‌ها'] },
          { title: 'فصل ۲: جریان اطلاعات در یاخته', topics: ['رانویسی', 'به سوی پروتئین', 'تنظیم بیان ژن'] },
          { title: 'فصل ۳: انتقال اطلاعات در نسل‌ها', topics: ['مفاهیم پایه', 'انواع وراثت'] },
          { title: 'فصل ۴: تغییر در اطلاعات وراثتی', topics: ['تغییر در ماده وراثتی جانداران', 'تغییر در جمعیت‌ها', 'علت‌های تغییر در گونه‌ها'] },
          { title: 'فصل ۵: از ماده به انرژی', topics: ['تامین انرژی', 'اکسایش قند', 'زیست‌نواختی'] },
          { title: 'فصل ۶: از انرژی به ماده', topics: ['فتوسنتز', 'واکنش‌های فتوسنتزی', 'فتوسنتز در شرایط مختلف'] },
          { title: 'فصل ۷: فناوری‌های جدید زیستی', topics: ['زیست‌فناوری و مهندسی ژنتیک', 'فناوری مهندسی پروتئین و بافت', 'کاربردهای زیست‌فناوری'] },
          { title: 'فصل ۸: رفتارهای جانوران', topics: ['اساس رفتار', 'انتخاب طبیعی و رفتار', 'ارتباط بین جانوران'] },
        ],
      },
    ],
    // Biology topic modes were intentionally removed (task 9). Do not recreate.
    topicModes: [],
  });
  console.log('✅ زیست‌شناسی created\n');

  // ----- 2) فیزیک (Physics) — chapters only, 5 topic modes -----
  await seedSubjectTree({
    name: 'فیزیک',
    color: '#F59E0B',
    icon: '⚛️',
    sortOrder: 2,
    grades: [
      {
        grade: 'دهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: فیزیک و اندازه گام' },
          { title: 'فصل ۲: ویژگی‌های فیزیکی مواد' },
          { title: 'فصل ۳: کار، انرژی و توان' },
          { title: 'فصل ۴: دما و گرمایی' },
        ],
      },
      {
        grade: 'یازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: الکتریسیته ساکن' },
          { title: 'فصل ۲: جریان الکتریکی و مدارهای جریان مستقیم' },
          { title: 'فصل ۳: مغناطیس و القای الکترومغناطیسی' },
        ],
      },
      {
        grade: 'دوازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: حرکت بر خط راست' },
          { title: 'فصل ۲: دینامیک و حرکت دائره‌ای' },
          { title: 'فصل ۳: نوسان و موج' },
          { title: 'فصل ۴: آشنایی با فیزیک اتمی و هسته‌ای' },
        ],
      },
    ],
    topicModes: [
      { title: 'مکانیک (حرکت‌شناسی، دینامیک، کار و انرژی)' },
      { title: 'نوسان، موج و فیزیک جدید (نوسان، موج، فیزیک اتمی و هسته‌ای)' },
      { title: 'الکتریسیته (الکتریسیته ساکن، جریان الکتریکی و مدارها)' },
      { title: 'مغناطیس و القا (میدان مغناطیسی و القای الکترومغناطیسی)' },
      { title: 'خواص ماده، دما و گرمایی (اندازه‌گیری، ویژگی‌های فیزیکی مواد، دما و گرمایی)' },
    ],
  });
  console.log('✅ فیزیک created\n');

  // ----- 3) شیمی (Chemistry) -----
  await seedSubjectTree({
    name: 'شیمی',
    color: '#EF4444',
    icon: '⚗️',
    sortOrder: 3,
    grades: [
      {
        grade: 'دهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: کیهان زادگاه الفبای هستی' },
          { title: 'فصل ۲: ردپای گازها در زندگی' },
          { title: 'فصل ۳: آب، مایع زلال زندگی' },
        ],
      },
      {
        grade: 'یازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: قدر هدایای زمین را بدانیم' },
          { title: 'فصل ۲: در پی غذای سالم' },
          { title: 'فصل ۳: پوشاک، نیازی پایان‌ناپذیر' },
        ],
      },
      {
        grade: 'دوازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: مولکول‌ها در خدمت سلامت' },
          { title: 'فصل ۲: آسایش و رفاه در سایه شیمی' },
          { title: 'فصل ۳: شیمی جلادهنده زندگی' },
          { title: 'فصل ۴: شیمی، راهی به سوی آینده‌ای روشن‌تر' },
        ],
      },
    ],
    topicModes: [
      { title: 'مفاهیم اولیه، ساختار اتم و جدول تناوبی' },
      { title: 'استوکیومتری و محاسبات عددی' },
      { title: 'شیمی آلی و درشت‌مولکول‌ها' },
      { title: 'ترمودینامیک، سینتیک و تعادل' },
      { title: 'الکتروشیمی و شیمی صنعتی' },
    ],
  });
  console.log('✅ شیمی created\n');

  // ----- 4) ریاضی (Math) -----
  await seedSubjectTree({
    name: 'ریاضی',
    color: '#3EB489',
    icon: '📐',
    sortOrder: 4,
    grades: [
      {
        grade: 'دهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: مجموعه، الگوی و دنباله' },
          { title: 'فصل ۲: مثلثات' },
          { title: 'فصل ۳: توان‌های رسانه‌ای و عبارات جبری' },
          { title: 'فصل ۴: معادله‌ها و ناامعادله‌ها' },
          { title: 'فصل ۵: تابع' },
          { title: 'فصل ۶: شمارش، بدون شمارش' },
          { title: 'فصل ۷: آمار و احتمال' },
        ],
      },
      {
        grade: 'یازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: هندسه تحلیلی و جبر' },
          { title: 'فصل ۲: هندسه' },
          { title: 'فصل ۳: تابع' },
          { title: 'فصل ۴: مثلثات' },
          { title: 'فصل ۵: توابع نمایی و لگاریتمی' },
          { title: 'فصل ۶: حد و پیوستگی' },
          { title: 'فصل ۷: آمار و احتمال' },
        ],
      },
      {
        grade: 'دوازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: تابع' },
          { title: 'فصل ۲: مثلثات' },
          { title: 'فصل ۳: حد بی‌نهایت و حد در بی‌نهایت' },
          { title: 'فصل ۴: مشتق' },
          { title: 'فصل ۵: کاربرد مشتق' },
          { title: 'فصل ۶: هندسه' },
          { title: 'فصل ۷: احتمال' },
        ],
      },
    ],
    topicModes: [
      { title: 'تابع و انواع آن' },
      { title: 'مثلثات' },
      { title: 'حد، پیوستگی و میل به بی‌نهایت' },
      { title: 'مشتق و کاربرد مشتق' },
      { title: 'هندسه و مقاطع مخروطی' },
      { title: 'آمار و احتمال' },
      { title: 'معادلات، نامعادلات و جبر' },
    ],
  });
  console.log('✅ ریاضی created\n');

  // ----- 5) زمین‌شناسی (Geology) — یازدهم only, both تجربی and ریاضی majors -----
  await seedSubjectTree({
    name: 'زمین‌شناسی',
    color: '#A16207',
    icon: '🪨',
    sortOrder: 5,
    grades: [
      {
        grade: 'یازدهم',
        major: 'تجربی',
        chapters: [
          { title: 'فصل ۱: آفرینش کیهان و تکوین زمین' },
          { title: 'فصل ۲: منابع معدنی و ذخایر انرژی زیربنای تمدن و توسعه' },
          { title: 'فصل ۳: منابع آب و خاک' },
          { title: 'فصل ۴: پویایی زمین' },
          { title: 'فصل ۵: زمین‌شناسی و سلامت' },
          { title: 'فصل ۶: زمین‌شناسی و سازه‌های مهندسی' },
          { title: 'فصل ۷: زمین‌شناسی ایران' },
        ],
      },
      {
        grade: 'یازدهم',
        major: 'ریاضی',
        chapters: [
          { title: 'فصل ۱: آفرینش کیهان و تکوین زمین' },
          { title: 'فصل ۲: منابع معدنی و ذخایر انرژی زیربنای تمدن و توسعه' },
          { title: 'فصل ۳: منابع آب و خاک' },
          { title: 'فصل ۴: پویایی زمین' },
          { title: 'فصل ۵: زمین‌شناسی و سلامت' },
          { title: 'فصل ۶: زمین‌شناسی و سازه‌های مهندسی' },
          { title: 'فصل ۷: زمین‌شناسی ایران' },
        ],
      },
    ],
    topicModes: [
      { title: 'کیهان، تکوین زمین و زمان زمین‌شناسی' },
      { title: 'منابع معدنی، کانی‌ها و سوخت‌های فسیلی' },
      { title: 'منابع آب، خاک و فرسایش' },
      { title: 'پویایی زمین، تکتونیک و مخاطرات طبیعی' },
      { title: 'زمین‌شناسی کاربردی: سلامت، سازه‌ها و ایران' },
    ],
  });
  console.log('✅ زمین‌شناسی created\n');

  // ----- Summary -----
  const stats = await Promise.all([
    db.subject.count(),
    db.gradeSubject.count(),
    db.chapter.count(),
    db.topic.count(),
    db.topicMode.count(),
  ]);
  console.log('🎉 Subjects seed complete!');
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
    await db.$disconnect();
  });
