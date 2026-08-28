import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewStudentTasks, isTaskFieldType, requireAuth, validateTaskCurriculum } from '@/lib/api-auth';
import { parseExamResponse } from '@/lib/exam-api';

// =================================================================
// GET /api/exams
// Returns exams visible to the authenticated user.
//
// Query params:
//   ?advisorId=xxx    → exams created by this advisor (forced to ctx.userId
//                        for ADVISOR role)
//   ?studentId=xxx    → exams where this student is a participant
//                        (must be the student themselves, their advisor,
//                         their institute manager, or a super admin)
//
// Response shape: { exams: Exam[] }
// =================================================================
export async function GET(request: NextRequest) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { searchParams } = new URL(request.url);
  const requestedAdvisorId = searchParams.get('advisorId');
  const requestedStudentId = searchParams.get('studentId');

  // Build the where clause based on role + query
  const where: Record<string, unknown> = {};

  if (ctx.user.role === 'ADVISOR') {
    if (requestedStudentId) {
      if (!(await canViewStudentTasks(ctx, requestedStudentId))) {
        return NextResponse.json({ error: 'دسترسی به آزمون‌های این دانش‌آموز مجاز نیست' }, { status: 403 });
      }
      where.participants = { some: { studentId: requestedStudentId } };
    } else {
      where.createdById = ctx.userId;
    }
  } else if (ctx.user.role === 'INSTITUTE_MANAGER') {
    where.instituteId = ctx.user.instituteId;
  } else if (ctx.user.role === 'SUPER_ADMIN') {
    if (requestedAdvisorId) where.createdById = requestedAdvisorId;
  } else {
    // STUDENT — only exams they're participating in
    where.participants = { some: { studentId: ctx.userId } };
  }

  // If studentId filter is explicitly requested, intersect with participant
  if (requestedStudentId && ctx.user.role !== 'STUDENT' && ctx.user.role !== 'ADVISOR') {
    // Verify the requester can see this student's exams
    where.participants = { some: { studentId: requestedStudentId } };
  }

  const rows = await db.exam.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      participants: { select: { studentId: true, lifecycleStatus: true } },
      results: { select: { studentId: true, score: true, rank: true } },
      analysisTasks: {
        where: requestedStudentId ? { studentId: requestedStudentId } : ctx.user.role === 'STUDENT' ? { studentId: ctx.userId } : undefined,
      },
      subjectAnalyses: {
        where: requestedStudentId ? { studentId: requestedStudentId } : ctx.user.role === 'STUDENT' ? { studentId: ctx.userId } : undefined,
      },
    },
  });

  // Map DB rows → API Exam shape (matches the frontend Exam interface)
  const exams = rows.map(parseExamResponse);

  return NextResponse.json({ exams });
}

// =================================================================
// POST /api/exams
// Creates a new exam. Only ADVISOR, INSTITUTE_MANAGER, and SUPER_ADMIN
// can create exams.
//
// Request body (matches Exam type minus id/createdAt which are generated):
//   { title, subject, subjectColor, date, startTime, duration, totalScore,
//     studentIds: string[], status? }
//
// Authorization:
//   - ADVISOR: createdBy is forced to ctx.userId; all studentIds must be
//              students assigned to this advisor.
//   - INSTITUTE_MANAGER: instituteId is forced to ctx.user.instituteId;
//              all studentIds must be in the same institute.
//   - SUPER_ADMIN: can specify any advisorId as creator.
//
// Response shape: { exam: Exam }
// =================================================================
export async function POST(request: NextRequest) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'بدنه درخواست نامعتبر است' },
      { status: 400 },
    );
  }

  const title = String(body.title ?? '').trim();
  const explicitScope = body.scope === 'SUBJECT' || body.scope === 'COMPREHENSIVE';
  const scope = body.scope === 'SUBJECT' || (!explicitScope && String(body.subject ?? '').trim()) ? 'SUBJECT' : 'COMPREHENSIVE';
  const subject = scope === 'COMPREHENSIVE' ? 'آزمون جامع' : String(body.subject ?? '').trim();
  const subjectColor = scope === 'COMPREHENSIVE' ? '#E57373' : String(body.subjectColor ?? '#E57373');
  const description = typeof body.description === 'string' ? body.description.trim() || null : null;
  const date = String(body.date ?? '');
  const startTime = String(body.startTime ?? '08:00');
  const duration = Number(body.duration ?? 90);
  const totalScore = Number(body.totalScore ?? 100);
  const requestedStudentIds = Array.isArray(body.studentIds)
    ? (body.studentIds as string[]).map(String)
    : [];
  const studentIds = ctx.user.role === 'STUDENT' ? [ctx.userId] : [...new Set(requestedStudentIds)];
  const status = String(body.status ?? 'upcoming');

  // Basic validation
  if (!title) {
    return NextResponse.json(
      { error: 'عنوان آزمون الزامی است' },
      { status: 400 },
    );
  }
  if (scope === 'SUBJECT' && !subject) {
    return NextResponse.json(
      { error: 'درس الزامی است' },
      { status: 400 },
    );
  }
  if (studentIds.length === 0) {
    return NextResponse.json(
      { error: 'حداقل یک دانش‌آموز انتخاب کنید' },
      { status: 400 },
    );
  }
  if (!date) {
    return NextResponse.json(
      { error: 'تاریخ الزامی است' },
      { status: 400 },
    );
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json(
      { error: 'مدت زمان نامعتبر است' },
      { status: 400 },
    );
  }
  if (!Number.isFinite(totalScore) || totalScore <= 0) {
    return NextResponse.json(
      { error: 'نمره کل نامعتبر است' },
      { status: 400 },
    );
  }

  let curriculum: Awaited<ReturnType<typeof validateTaskCurriculum>> = null;
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId : null;
  if (scope === 'SUBJECT' && explicitScope) {
    if (!subjectId) {
      return NextResponse.json({ error: 'برای آزمون تک‌درسی، انتخاب درس الزامی است' }, { status: 400 });
    }
    curriculum = await validateTaskCurriculum({
      studentId: studentIds[0],
      subjectId,
      fieldType: isTaskFieldType(body.fieldType) ? body.fieldType : null,
      curriculumMode: body.curriculumMode,
      chapterId: body.chapterId,
      topicId: body.topicId,
      topicIds: body.topicId ? [body.topicId] : [],
      topicModeId: body.topicModeId,
      pageStart: body.pageStart,
      pageEnd: body.pageEnd,
      allowSubjectOnly: body.curriculumMode == null,
      allowAllGrades: true,
    });
    if (!curriculum) {
      return NextResponse.json({ error: 'درس یا جزئیات محتوای آزمون معتبر نیست' }, { status: 400 });
    }
  }

  // Determine creator + institute
  const createdById = ctx.userId;
  let instituteId: string | null = null;
  if (ctx.user.role === 'INSTITUTE_MANAGER') {
    instituteId = ctx.user.instituteId;
  } else if (ctx.user.role === 'ADVISOR') {
    // Advisor's institute (may be null if not assigned to an institute)
    instituteId = ctx.user.instituteId;
  }

  // Verify the studentIds are valid students the creator can access
  // (skip the check for super admin to keep things flexible)
  if (ctx.user.role === 'ADVISOR') {
    const validStudents = await db.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        assignedAdvisorId: ctx.userId,
      },
      select: { id: true },
    });
    if (validStudents.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'برخی دانش‌آموزان به شما اختصاص ندارند' },
        { status: 403 },
      );
    }
  } else if (ctx.user.role === 'INSTITUTE_MANAGER') {
    const validStudents = await db.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        instituteId: ctx.user.instituteId,
      },
      select: { id: true },
    });
    if (validStudents.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'برخی دانش‌آموزان در آموزشگاه شما نیستند' },
        { status: 403 },
      );
    }
  }

  // Create the exam with participants in a transaction
  const created = await db.$transaction(async (tx) => {
    const exam = await tx.exam.create({
      data: {
        title,
        subject: curriculum?.subject.name ?? subject,
        subjectColor: curriculum?.subject.color ?? subjectColor,
        scope,
        description,
        subjectId: curriculum?.subject.id ?? null,
        fieldType: isTaskFieldType(body.fieldType) ? body.fieldType : null,
        chapterId: curriculum?.chapterId ?? null,
        topicId: curriculum?.topicId ?? null,
        topicModeId: curriculum?.topicModeId ?? null,
        curriculumMode: curriculum?.mode ?? null,
        curriculumLabel: curriculum?.topic ?? null,
        pageStart: curriculum?.pageStart ?? null,
        pageEnd: curriculum?.pageEnd ?? null,
        date,
        startTime,
        duration,
        totalScore,
        status,
        createdById,
        instituteId,
        participants: {
          create: studentIds.map((sid) => ({ studentId: sid })),
        },
      },
      include: {
        participants: { select: { studentId: true, lifecycleStatus: true } },
        results: { select: { studentId: true, score: true, rank: true } },
        analysisTasks: true,
        subjectAnalyses: true,
      },
    });

    await Promise.all(studentIds.map((studentId) => tx.examTitleSuggestion.upsert({
      where: { studentId_value: { studentId, value: title } },
      create: { studentId, value: title },
      update: { createdAt: new Date() },
    })));

    return exam;
  });

  const exam = parseExamResponse(created);

  return NextResponse.json({ exam }, { status: 201 });
}
