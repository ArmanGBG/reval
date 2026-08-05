import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Hash password helper
function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // ===== 1. Create Super Admin =====
  const superAdmin = await prisma.user.upsert({
    where: { phone: '09121000000' },
    update: {},
    create: {
      phone: '09121000000',
      password: hashPassword('1234'),
      name: 'سوپر ادمین',
      avatar: '👑',
      role: 'SUPER_ADMIN',
      dailyTargetHours: 0,
    },
  });
  console.log('✅ Super Admin:', superAdmin.name, '| phone:', superAdmin.phone);

  // ===== 2. Create Institute Manager =====
  const manager = await prisma.user.upsert({
    where: { phone: '09121111111' },
    update: {},
    create: {
      phone: '09121111111',
      password: hashPassword('1234'),
      name: 'آقای احمدی',
      avatar: '👨‍💼',
      role: 'INSTITUTE_MANAGER',
      dailyTargetHours: 0,
    },
  });
  console.log('✅ Institute Manager:', manager.name, '| phone:', manager.phone);

  // ===== 3. Create Institute =====
  const institute = await prisma.institute.upsert({
    where: { id: 'inst1' },
    update: {},
    create: {
      id: 'inst1',
      name: 'آموزشگاه هدف',
      subscriptionPlan: 'pro',
      status: 'active',
      managerId: manager.id,
    },
  });
  console.log('✅ Institute:', institute.name);

  // Link manager to institute
  await prisma.user.update({
    where: { id: manager.id },
    data: { instituteId: 'inst1' },
  });

  // ===== 4. Create Advisors =====
  const advisor1 = await prisma.user.upsert({
    where: { phone: '09121234567' },
    update: {},
    create: {
      phone: '09121234567',
      password: hashPassword('1234'),
      name: 'دکتر محمدی',
      avatar: '👨‍🏫',
      role: 'ADVISOR',
      dailyTargetHours: 0,
      instituteId: 'inst1',
    },
  });

  const advisor2 = await prisma.user.upsert({
    where: { phone: '09129876543' },
    update: {},
    create: {
      phone: '09129876543',
      password: hashPassword('1234'),
      name: 'سرکار خانم احمدی',
      avatar: '👩‍🏫',
      role: 'ADVISOR',
      dailyTargetHours: 0,
      instituteId: 'inst1',
    },
  });

  const advisor3 = await prisma.user.upsert({
    where: { phone: '09123456789' },
    update: {},
    create: {
      phone: '09123456789',
      password: hashPassword('1234'),
      name: 'آقای رضایی',
      avatar: '🧑‍🏫',
      role: 'ADVISOR',
      dailyTargetHours: 0,
      instituteId: 'inst1',
    },
  });
  console.log('✅ Advisors:', advisor1.name, advisor2.name, advisor3.name);

  // ===== 5. Create Students =====
  const student1 = await prisma.user.upsert({
    where: { phone: '09131111111' },
    update: {},
    create: {
      phone: '09131111111',
      password: hashPassword('1234'),
      name: 'سارا محمدی',
      avatar: '🦊',
      role: 'STUDENT',
      grade: 'دوازدهم',
      major: 'تجربی',
      goal: 'کنکور',
      dailyTargetHours: 6,
      instituteId: 'inst1',
      assignedAdvisorId: advisor2.id,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { phone: '09132222222' },
    update: {},
    create: {
      phone: '09132222222',
      password: hashPassword('1234'),
      name: 'امیرحسین رضایی',
      avatar: '🐺',
      role: 'STUDENT',
      grade: 'دوازدهم',
      major: 'ریاضی',
      goal: 'کنکور',
      dailyTargetHours: 8,
      instituteId: 'inst1',
      assignedAdvisorId: advisor1.id,
    },
  });

  const student3 = await prisma.user.upsert({
    where: { phone: '09133333333' },
    update: {},
    create: {
      phone: '09133333333',
      password: hashPassword('1234'),
      name: 'فاطمه احمدی',
      avatar: '🦁',
      role: 'STUDENT',
      grade: 'یازدهم',
      major: 'انسانی',
      goal: 'کنکور',
      dailyTargetHours: 5,
      instituteId: 'inst1',
      assignedAdvisorId: advisor3.id,
    },
  });

  const student4 = await prisma.user.upsert({
    where: { phone: '09134444444' },
    update: {},
    create: {
      phone: '09134444444',
      password: hashPassword('1234'),
      name: 'محمد حسینی',
      avatar: '🐯',
      role: 'STUDENT',
      grade: 'پشت کنکوری',
      major: 'تجربی',
      goal: 'کنکور',
      dailyTargetHours: 10,
      instituteId: 'inst1',
      assignedAdvisorId: advisor1.id,
    },
  });

  const student5 = await prisma.user.upsert({
    where: { phone: '09135555555' },
    update: {},
    create: {
      phone: '09135555555',
      password: hashPassword('1234'),
      name: 'زهرا کریمی',
      avatar: '🦅',
      role: 'STUDENT',
      grade: 'دوازدهم',
      major: 'تجربی',
      goal: 'کنکور',
      dailyTargetHours: 6,
      instituteId: 'inst1',
      assignedAdvisorId: null, // No advisor - independent student
    },
  });

  console.log('✅ Students:', student1.name, student2.name, student3.name, student4.name, student5.name);

  // ===== 6. Create Tasks =====
  const today = new Date().toISOString().split('T')[0];
  const tasksData = [
    { studentId: student1.id, subject: 'ریاضی', subjectColor: '#3EB489', topic: 'حد و پیوستگی', fieldType: 'کنکور', activityTypes: '["مطالعه","تست آموزشی"]', targetTimeMinutes: 90, targetTestCount: 30, createdBy: 'advisor', createdById: advisor1.id, order: 1 },
    { studentId: student1.id, subject: 'فیزیک', subjectColor: '#F59E0B', topic: 'الکتریسیته ساکن', fieldType: 'کنکور', activityTypes: '["مطالعه","تست سنجشی"]', targetTimeMinutes: 60, targetTestCount: 20, createdBy: 'advisor', createdById: advisor1.id, order: 2 },
    { studentId: student1.id, subject: 'شیمی', subjectColor: '#EF4444', topic: 'الکتروشیمی', fieldType: 'کنکور', activityTypes: '["مرور","تست آموزشی"]', targetTimeMinutes: 45, targetTestCount: 15, createdBy: 'advisor', createdById: advisor2.id, order: 3 },
    { studentId: student1.id, subject: 'ادبیات', subjectColor: '#EC4899', topic: 'آرایه‌های ادبی', fieldType: 'نهایی', activityTypes: '["مرور","تست آموزشی"]', targetTimeMinutes: 40, targetTestCount: 10, createdBy: 'student', createdById: student1.id, order: 4 },
    { studentId: student2.id, subject: 'ریاضی', subjectColor: '#3EB489', topic: 'مشتق', fieldType: 'کنکور', activityTypes: '["مطالعه","تست آموزشی"]', targetTimeMinutes: 60, targetTestCount: 20, createdBy: 'advisor', createdById: advisor1.id, order: 1 },
    { studentId: student2.id, subject: 'فیزیک', subjectColor: '#F59E0B', topic: 'مغناطیس', fieldType: 'کنکور', activityTypes: '["مطالعه"]', targetTimeMinutes: 45, targetTestCount: 15, createdBy: 'advisor', createdById: advisor1.id, order: 2 },
    { studentId: student4.id, subject: 'زیست', subjectColor: '#8B5CF6', topic: 'سلول', fieldType: 'کنکور', activityTypes: '["مرور","تست سنجشی"]', targetTimeMinutes: 90, targetTestCount: 40, createdBy: 'advisor', createdById: advisor2.id, order: 1 },
    { studentId: student5.id, subject: 'شیمی', subjectColor: '#EF4444', topic: 'تعادل شیمیایی', fieldType: 'کنکور', activityTypes: '["مطالعه","تست آموزشی"]', targetTimeMinutes: 30, targetTestCount: 10, createdBy: 'student', createdById: student5.id, order: 1 },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        studentId: t.studentId,
        subject: t.subject,
        subjectColor: t.subjectColor,
        topic: t.topic,
        fieldType: t.fieldType,
        activityTypes: t.activityTypes,
        targetTimeMinutes: t.targetTimeMinutes,
        targetTestCount: t.targetTestCount,
        completed: null,
        date: today,
        order: t.order,
        createdBy: t.createdBy,
        createdById: t.createdById,
      },
    });
  }
  console.log('✅ Tasks:', tasksData.length, 'created');

  // ===== 7. Create Exams =====
  const exam1 = await prisma.exam.create({
    data: {
      title: 'آزمون جامع ریاضی - اسفند',
      subject: 'ریاضی',
      subjectColor: '#3EB489',
      date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      startTime: '08:00',
      duration: 120,
      totalScore: 100,
      status: 'upcoming',
      createdById: advisor1.id,
      instituteId: 'inst1',
    },
  });

  const exam2 = await prisma.exam.create({
    data: {
      title: 'آزمون تستی فیزیک - بهمن',
      subject: 'فیزیک',
      subjectColor: '#F59E0B',
      date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      startTime: '14:00',
      duration: 90,
      totalScore: 100,
      status: 'upcoming',
      createdById: advisor1.id,
      instituteId: 'inst1',
    },
  });

  const exam3 = await prisma.exam.create({
    data: {
      title: 'آزمون شیمی - دی',
      subject: 'شیمی',
      subjectColor: '#EF4444',
      date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      startTime: '10:00',
      duration: 90,
      totalScore: 100,
      status: 'completed',
      createdById: advisor2.id,
      instituteId: 'inst1',
    },
  });

  // Exam participants
  const examParticipants = [
    { examId: exam1.id, studentId: student1.id },
    { examId: exam1.id, studentId: student2.id },
    { examId: exam1.id, studentId: student4.id },
    { examId: exam2.id, studentId: student1.id },
    { examId: exam2.id, studentId: student2.id },
    { examId: exam3.id, studentId: student1.id },
    { examId: exam3.id, studentId: student4.id },
    { examId: exam3.id, studentId: student5.id },
  ];

  for (const ep of examParticipants) {
    await prisma.examParticipant.create({ data: ep });
  }

  // Exam results for completed exam
  const examResults = [
    { examId: exam3.id, studentId: student1.id, score: 82, rank: 1 },
    { examId: exam3.id, studentId: student4.id, score: 91, rank: null },
    { examId: exam3.id, studentId: student5.id, score: 38, rank: 3 },
  ];

  for (const er of examResults) {
    await prisma.examResult.create({ data: er });
  }

  console.log('✅ Exams:', 3, 'created with participants and results');

  // ===== Summary =====
  console.log('\n🎉 Seed complete! Here are the test accounts:\n');
  console.log('┌─────────────────────┬───────────────┬────────┐');
  console.log('│ Role                │ Phone         │ Pass   │');
  console.log('├─────────────────────┼───────────────┼────────┤');
  console.log('│ 👑 سوپر ادمین       │ 09121000000   │ 1234   │');
  console.log('│ 👨‍💼 مدیر آموزشگاه    │ 09121111111   │ 1234   │');
  console.log('│ 👨‍🏫 مشاور (محمدی)   │ 09121234567   │ 1234   │');
  console.log('│ 👩‍🏫 مشاور (احمدی)   │ 09129876543   │ 1234   │');
  console.log('│ 🧑‍🏫 مشاور (رضایی)   │ 09123456789   │ 1234   │');
  console.log('│ 🦊 دانش‌آموز (سارا) │ 09131111111   │ 1234   │');
  console.log('│ 🐺 دانش‌آموز (امیر) │ 09132222222   │ 1234   │');
  console.log('│ 🦁 دانش‌آموز (فاطمه)│ 09133333333   │ 1234   │');
  console.log('│ 🐯 دانش‌آموز (محمد) │ 09134444444   │ 1234   │');
  console.log('│ 🦅 دانش‌آموز (زهرا) │ 09135555555   │ 1234   │');
  console.log('└─────────────────────┴───────────────┴────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
