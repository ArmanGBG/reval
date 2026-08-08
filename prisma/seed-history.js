// Seed historical completed tasks for student سارا so analytics charts/heatmap
// look populated for the landing-page screenshots.
//
// Creates ~14 days of study history across 5 subjects with realistic study
// times and test counts. Mix of completed / skipped / pending so the analytics
// "completion rate" looks real. Idempotent: skips days that already have
// completed tasks for this student.
//
// Run: node prisma/seed-history.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUBJECTS = [
  { id: 'cmsk1ycki000mp0c3ga04fwju', name: 'ریاضی', color: '#3E9F70' },
  { id: 'cmsk1yckf000ip0c3oimgyk3d', name: 'فیزیک', color: '#F59E0B' },
  { id: 'cmsk1yckg000jp0c3gzymzch5', name: 'شیمی', color: '#EF4444' },
  { id: 'cmsk1yckh000lp0c3ozd3hd84', name: 'ادبیات', color: '#EC4899' },
  { id: 'cmsk1yckg000kp0c3hu9dndtj', name: 'زیست‌شناسی', color: '#8B5CF6' },
];

const TOPICS = {
  'ریاضی': ['حد و پیوستگی', 'مشتق', 'انتگرال', 'تابع', 'تابع نمایی', 'لگاریتم', 'تابع مثلثاتی', 'احتمال'],
  'فیزیک': ['الکتریسیته ساکن', 'جریان الکتریکی', 'مغناطیس', 'القای الکترومغناطیسی', 'نوسانات', 'موج', 'نور', 'اتم'],
  'شیمی': ['الکتروشیمی', 'تعادل شیمیایی', 'سینتیک', 'اسید و باز', 'حلالیت', 'گازها', 'مول', 'ساختار اتم'],
  'ادبیات': ['آرایه‌های ادبی', 'زبان فارسی', 'تاریخ ادبیات', 'عروض', 'قافیه', 'متن‌فهمی', 'املا', 'دستور زبان'],
  'زیست‌شناسی': ['سلول', 'ژنتیک', 'تقسیم یاخته', 'تنفس', 'فتوسنتز', 'اعصاب', 'گوارش', 'خون'],
};

const ACTIVITIES = ['["مطالعه","تست آموزشی"]', '["مطالعه","تست سنجشی"]', '["مرور","تست آموزشی"]', '["مطالعه"]', '["مرور","تست سنجشی"]'];
const FIELDS = ['کنکور', 'کنکور', 'کنکور', 'نهایی']; // mostly کنکور

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

async function main() {
  const sara = await prisma.user.findFirst({ where: { phone: '09131111111' } });
  if (!sara) throw new Error('Student سارا not found. Run prisma/seed.ts first.');

  // Idempotency: if there are already >10 completed tasks, assume history is seeded.
  const existingCompleted = await prisma.task.count({
    where: { studentId: sara.id, completed: true },
  });
  if (existingCompleted > 10) {
    console.log(`ℹ️  ${existingCompleted} completed tasks already exist — skipping history seed.`);
    return;
  }

  let created = 0;
  const now = Date.now();
  const DAY = 86400000;

  // Generate 14 days of history (days -14 to -1, i.e. not today)
  for (let d = 14; d >= 1; d--) {
    const date = new Date(now - d * DAY).toISOString().split('T')[0];
    // 2-4 tasks per day
    const tasksToday = rand(2, 4);
    const subjectsToday = [...SUBJECTS].sort(() => Math.random() - 0.5).slice(0, tasksToday);

    for (let i = 0; i < subjectsToday.length; i++) {
      const subj = subjectsToday[i];
      const topic = pick(TOPICS[subj.name]);
      const field = pick(FIELDS);
      const targetTime = pick([30, 45, 60, 75, 90, 120]);
      const targetTests = pick([10, 15, 20, 25, 30, 40]);
      const activity = pick(ACTIVITIES);

      // 82% completed, 12% skipped, 6% pending
      const r = Math.random();
      let completed, actualTime, actualTests;
      if (r < 0.82) {
        completed = true;
        actualTime = Math.round(targetTime * (0.7 + Math.random() * 0.5)); // 70-120% of target
        actualTests = Math.round(targetTests * (0.6 + Math.random() * 0.6));
      } else if (r < 0.94) {
        completed = false; // skipped
        actualTime = null;
        actualTests = null;
      } else {
        completed = null; // pending
        actualTime = null;
        actualTests = null;
      }

      await prisma.task.create({
        data: {
          studentId: sara.id,
          subjectId: subj.id,
          subject: subj.name,
          subjectColor: subj.color,
          topic,
          fieldType: field,
          activityTypes: activity,
          targetTimeMinutes: targetTime,
          actualTimeMinutes: actualTime,
          targetTestCount: targetTests,
          actualTestCount: actualTests,
          completed,
          detailsCompleted: true,
          date,
          order: i + 1,
          createdBy: 'student',
          createdById: sara.id,
        },
      });
      created++;
    }
  }

  console.log(`✅ Seeded ${created} historical tasks for ${sara.name} across 14 days.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
