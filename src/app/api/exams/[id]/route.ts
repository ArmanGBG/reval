import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import type { Exam } from '@/lib/types';

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
    select: { id: true, createdById: true, instituteId: true },
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

  if (!isCreator && !isSuperAdmin && !isManagerOfInstitute) {
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

  // Build update data from provided fields
  const data: Record<string, unknown> = {};
  if (typeof body.title === 'string') data.title = body.title.trim();
  if (typeof body.subject === 'string') data.subject = body.subject;
  if (typeof body.subjectColor === 'string') data.subjectColor = body.subjectColor;
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
        participants: { select: { studentId: true } },
        results: { select: { studentId: true, score: true, rank: true } },
      },
    });
    return exam;
  });

  const exam: Exam = {
    id: updated.id,
    title: updated.title,
    subject: updated.subject,
    subjectColor: updated.subjectColor,
    date: updated.date,
    startTime: updated.startTime,
    duration: updated.duration,
    totalScore: updated.totalScore,
    studentIds: updated.participants.map((p) => p.studentId),
    status: updated.status as Exam['status'],
    results: updated.results.map((r) => ({
      studentId: r.studentId,
      score: r.score,
      rank: r.rank,
    })),
    createdBy: updated.createdById,
    createdAt: updated.createdAt.toISOString(),
  };

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
