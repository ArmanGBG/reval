import { db } from '../src/lib/db';

async function seed() {
  console.log('--- Starting Dashboard Test Data Seed ---');

  // 1. Fetch available subjects
  const subjects = await db.subject.findMany();
  if (subjects.length === 0) {
    throw new Error('No subjects found in database! Please seed subjects first.');
  }

  const subjectColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#e11d48'];

  // 2. Define 5 Advisors
  const advisorData = [
    { firstName: 'احمد', lastName: 'حسینی', phone: '09122000001', avatar: '👨‍🏫', dayOffset: 0 },
    { firstName: 'مریم', lastName: 'کاظمی', phone: '09122000002', avatar: '👩‍🏫', dayOffset: 1 },
    { firstName: 'پویا', lastName: 'رضازاده', phone: '09122000003', avatar: '👨‍💼', dayOffset: 2 },
    { firstName: 'سارا', lastName: 'سلیمانی', phone: '09122000004', avatar: '👩‍⚕️', dayOffset: 4 },
    { firstName: 'نیما', lastName: 'پیروز', phone: '09122000005', avatar: '🧑‍🏫', dayOffset: 6 },
  ];

  // 3. Define 30 Students with distributed signup dates (from 2026-09-22 / 31 Shahrivar to 2026-09-29)
  const studentNames = [
    { first: 'علی', last: 'احمدی', dayOffset: 0 },
    { first: 'رضا', last: 'صادقی', dayOffset: 0 },
    { first: 'فاطمه', last: 'مرادی', dayOffset: 0 },
    { first: 'زهرا', last: 'باقری', dayOffset: 0 },
    { first: 'حسین', last: 'قنبری', dayOffset: 1 },
    { first: 'سجاد', last: 'ناصری', dayOffset: 1 },
    { first: 'الناز', last: 'شاکری', dayOffset: 1 },
    { first: 'پویا', last: 'تهرانی', dayOffset: 2 },
    { first: 'سوگند', last: 'معتمدی', dayOffset: 2 },
    { first: 'نوید', last: 'پوریا', dayOffset: 2 },
    { first: 'کیانوش', last: 'امینی', dayOffset: 2 },
    { first: 'نگین', last: 'نوری', dayOffset: 2 },
    { first: 'آرمان', last: 'جعفری', dayOffset: 3 },
    { first: 'شایان', last: 'کریمی', dayOffset: 3 },
    { first: 'باران', last: 'یزدانی', dayOffset: 3 },
    { first: 'مانی', last: 'شریفی', dayOffset: 3 },
    { first: 'یلدا', last: 'بهرامی', dayOffset: 4 },
    { first: 'پارسا', last: 'اسدی', dayOffset: 4 },
    { first: 'رویا', last: 'نجات', dayOffset: 4 },
    { first: 'بهاره', last: 'کمالی', dayOffset: 5 },
    { first: 'امیرعلی', last: 'حیدری', dayOffset: 5 },
    { first: 'مهدی', last: 'عباسی', dayOffset: 5 },
    { first: 'نازنین', last: 'راد', dayOffset: 5 },
    { first: 'سینا', last: 'اکبری', dayOffset: 6 },
    { first: 'آوا', last: 'خسروی', dayOffset: 6 },
    { first: 'متین', last: 'سلطانی', dayOffset: 6 },
    { first: 'ترانه', last: 'جوادی', dayOffset: 6 },
    { first: 'دانیال', last: 'پناهی', dayOffset: 7 },
    { first: 'عسل', last: 'موسوی', dayOffset: 7 },
    { first: 'فرهاد', last: 'داوودی', dayOffset: 7 },
  ];

  // Base date: 2026-09-22 08:30:00 (31 Shahrivar)
  const baseStartDate = new Date(Date.UTC(2026, 8, 22, 5, 0, 0)); // 08:30 Iran time

  // 4. Create Advisors
  console.log('Creating 5 advisors...');
  const createdAdvisors: any[] = [];
  for (let i = 0; i < advisorData.length; i++) {
    const adv = advisorData[i];
    const createdAt = new Date(baseStartDate.getTime() + adv.dayOffset * 86400000 + (i * 3600000));
    
    // Upsert or create
    const user = await db.user.upsert({
      where: { phone: adv.phone },
      update: {},
      create: {
        phone: adv.phone,
        firstName: adv.firstName,
        lastName: adv.lastName,
        avatar: adv.avatar,
        role: 'ADVISOR',
        phoneVerifiedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      }
    });
    createdAdvisors.push(user);
  }
  console.log(`Created ${createdAdvisors.length} advisors.`);

  // 5. Create Students
  console.log('Creating 30 students...');
  const createdStudents: any[] = [];
  for (let i = 0; i < studentNames.length; i++) {
    const st = studentNames[i];
    const phone = `0912100${String(i + 1).padStart(4, '0')}`;
    const createdAt = new Date(baseStartDate.getTime() + st.dayOffset * 86400000 + ((i % 8) * 3600000 + 1800000));
    
    // Most students verify their phone (first 26 students verified, 4 unverified to test funnel)
    const phoneVerifiedAt = i < 26 ? new Date(createdAt.getTime() + 300000) : null;

    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        firstName: st.first,
        lastName: st.last,
        avatar: ['🦊', '🐻', '🐼', '🦁', '🐯', '🐰'][i % 6],
        role: 'STUDENT',
        grade: ['دهم', 'یازدهم', 'دوازدهم'][i % 3],
        major: ['تجربی', 'ریاضی', 'انسانی'][i % 3],
        province: 'تهران',
        city: 'تهران',
        phoneVerifiedAt,
        createdAt,
        updatedAt: createdAt,
      }
    });
    createdStudents.push({ user, dayOffset: st.dayOffset, createdAt });
  }
  console.log(`Created ${createdStudents.length} students.`);

  // 6. Connect 10 random students to advisors
  console.log('Connecting 10 students to advisors...');
  // Shuffle students to pick 10
  const shuffledStudents = [...createdStudents].sort(() => 0.5 - Math.random());
  const selected10 = shuffledStudents.slice(0, 10);

  for (let i = 0; i < selected10.length; i++) {
    const student = selected10[i].user;
    const advisor = createdAdvisors[i % createdAdvisors.length];
    const matchTime = new Date(selected10[i].createdAt.getTime() + 7200000); // 2 hours after signup

    // Update student's assignedAdvisorId
    await db.user.update({
      where: { id: student.id },
      data: { assignedAdvisorId: advisor.id }
    });

    // Create ConnectionRequest
    await db.connectionRequest.upsert({
      where: {
        studentId_advisorId: {
          studentId: student.id,
          advisorId: advisor.id
        }
      },
      update: {
        status: 'ACCEPTED',
        updatedAt: matchTime,
        respondedAt: matchTime
      },
      create: {
        studentId: student.id,
        advisorId: advisor.id,
        initiatedBy: 'STUDENT',
        status: 'ACCEPTED',
        createdAt: matchTime,
        updatedAt: matchTime,
        respondedAt: matchTime,
      }
    });
  }
  console.log('Assigned 10 students to advisors with ACCEPTED ConnectionRequests.');

  // 7. Generate Tasks for students from their signup date to 2026-09-29
  console.log('Generating tasks for students...');
  let totalTasks = 0;
  let totalCompleted = 0;

  for (let i = 0; i < createdStudents.length; i++) {
    const { user, dayOffset, createdAt } = createdStudents[i];
    
    // To test the activation funnel: first 25 students get tasks (activated), last 5 have 0 tasks (unactivated)
    if (i >= 25) {
      continue;
    }

    // Days active = from dayOffset up to 7 (2026-09-29)
    for (let day = dayOffset; day <= 7; day++) {
      const taskDateObj = new Date(baseStartDate.getTime() + day * 86400000);
      const isoDate = taskDateObj.toISOString().split('T')[0];

      // Give 2 to 4 tasks per day
      const tasksPerDay = 2 + (day % 3);

      for (let t = 0; t < tasksPerDay; t++) {
        const subject = subjects[(i + day + t) % subjects.length];
        const color = subjectColors[(i + t) % subjectColors.length];
        
        // Random completion: ~65% completion rate
        const isDone = Math.random() < 0.65;
        const targetTime = [45, 60, 90, 120][(t + i) % 4];
        const actualTime = isDone ? Math.round(targetTime * (0.8 + Math.random() * 0.4)) : null;

        const taskTime = new Date(taskDateObj.getTime() + (9 + t * 2) * 3600000);

        await db.task.create({
          data: {
            studentId: user.id,
            subjectId: subject.id,
            subject: subject.name,
            subjectColor: color,
            topic: `فصل ${(t % 4) + 1} - مبحث ${(t % 3) + 1}`,
            date: isoDate,
            order: t + 1,
            createdBy: 'student',
            status: isDone ? 'DONE' : 'PENDING',
            completed: isDone ? true : (Math.random() < 0.3 ? false : null),
            targetTimeMinutes: targetTime,
            actualTimeMinutes: actualTime,
            targetTestCount: 20 + t * 5,
            actualTestCount: isDone ? 18 + t * 5 : null,
            createdAt: taskTime,
            updatedAt: taskTime,
          }
        });

        totalTasks++;
        if (isDone) totalCompleted++;
      }
    }
  }

  console.log(`Generated ${totalTasks} tasks in total (${totalCompleted} marked completed).`);
  console.log('--- Seed Completed Successfully! ---');
}

seed()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
