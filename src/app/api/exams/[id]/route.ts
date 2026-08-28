import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { parseExamResponse } from '@/lib/exam-api';
import { isExamParticipantStatus } from '@/lib/exam-lifecycle';

// =================================================================
// PATCH /api/exams/[id]
// Updates an exam. Only the creator (or a super admin) can modify it.
//
// Request body (all optional):
//   { title?, subject?, subjectColor?, date?, startTime?, duration?,
//     totalScore?, status?, studentIds? }
//
// If studentIds is provided, it replaces the entire participant list.
//
// Response shape: { exam: Exam }
// =================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { id } = await params;

  // Fetch the exam to check ownership
  const existing = await db.exam.findUnique({
    where: { id },
    select: { id: true, createdById: true, instituteId: true, participants: { select: { studentId: true } } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'آزمون یافت نشد' },
      { status: 404 },
    );
  }

  // Authorization: creator or super admin (or institute manager of the institute)
  const isCreator = existing.createdById === ctx.userId;
  const isSuperAdmin = ctx.user.role === 'SUPER_ADMIN';
  const isManagerOfInstitute =
    ctx.user.role === 'INSTITUTE_MANAGER' &&
    existing.instituteId === ctx.user.instituteId;
  const isParticipantLifecyclePatch = ctx.user.role === 'STUDENT'
    && existing.participants.some((participant) => participant.studentId === ctx.userId);

  if (!isCreator && !isSuperAdmin && !isManagerOfInstitute && !isParticipantLifecyclePatch) {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'بدنه درخواست نامعتبر است' },
      { status: 400 },
    );
  }

  if (isParticipantLifecyclePatch) {
    if (Object.keys(body).length !== 1 || !isExamParticipantStatus(body.participantStatus)) {
      return NextResponse.json({ error: 'دانش‌آموز فقط می‌تواند وضعیت انجام آزمون خود را تغییر دهد' }, { status: 403 });
    }
    const updatedParticipant = await db.examParticipant.update({
      where: { examId_studentId: { examId: id, studentId: ctx.userId } },
      data: { lifecycleStatus: body.participantStatus },
    });
    return NextResponse.json({ participant: { studentId: updatedParticipant.studentId, status: updatedParticipant.lifecycleStatus } });
  }

  // Build update data from provided fields
  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') data.title = body.title.trim();
  if (typeof body.subject === 'string') data.subject = body.subject;
  if (typeof body.subjectColor === 'string') data.subjectColor = body.subjectColor;
  if (body.scope === 'COMPREHENSIVE' || body.scope === 'SUBJECT') data.scope = body.scope;
  if (typeof body.description === 'string' || body.description === null) data.description = typeof body.description === 'string' ? body.description.trim() || null : null;
  if (typeof body.date === 'string') data.date = body.date;
  if (typeof body.startTime === 'string') data.startTime = body.startTime;
  if (typeof body.duration === 'number') data.duration = body.duration;
  if (typeof body.totalScore === 'number') data.totalScore = body.totalScore;
  if (typeof body.status === 'string') data.status = body.status;

  // If studentIds is provided, replace the participants
  const newStudentIds = Array.isArray(body.studentIds)
    ? (body.studentIds as string[]).map(String)
    : null;

  const updated = await db.$transaction(async (tx) => {
    // Replace participants if requested
    if (newStudentIds && newStudentIds.length > 0) {
      await tx.examParticipant.deleteMany({ where: { examId: id } });
      await tx.examParticipant.createMany({
        data: newStudentIds.map((sid) => ({ examId: id, studentId: sid })),
      });
    }

    const exam = await tx.exam.update({
      where: { id },
      data,
      include: {
        participants: { select: { studentId: true, lifecycleStatus: true } },
        results: { select: { studentId: true, score: true, rank: true } },
        analysisTasks: true,
        subjectAnalyses: true,
      },
    });
    return exam;
  });

  const exam = parseExamResponse(updated);

  return NextResponse.json({ exam });
}

// =================================================================
// DELETE /api/exams/[id]
// Deletes an exam. Only the creator (or a super admin) can delete it.
// Cascade deletes participants + results (configured in Prisma schema).
//
// Response shape: { ok: true }
// =================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { id } = await params;

  const existing = await db.exam.findUnique({
    where: { id },
    select: { id: true, createdById: true, instituteId: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'آزمون یافت نشد' },
      { status: 404 },
    );
  }

  const isCreator = existing.createdById === ctx.userId;
  const isSuperAdmin = ctx.user.role === 'SUPER_ADMIN';
  const isManagerOfInstitute =
    ctx.user.role === 'INSTITUTE_MANAGER' &&
    existing.instituteId === ctx.user.instituteId;

  if (!isCreator && !isSuperAdmin && !isManagerOfInstitute) {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  await db.exam.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
