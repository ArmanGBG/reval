import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import type { ExamResult } from '@/lib/types';

// =================================================================
// PUT /api/exams/[id]/results
// Bulk upsert exam results (score + rank per student).
// Replaces all existing results for this exam with the provided list.
//
// Request body:
//   { results: [{ studentId, score?, rank? }] }
//
// Authorization: exam creator, super admin, or institute manager of
// the exam's institute.
//
// Response shape: { results: ExamResult[] }
// =================================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { id } = await params;

  // Fetch exam + ownership info
  const existing = await db.exam.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      instituteId: true,
      totalScore: true,
      participants: { select: { studentId: true } },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'آزمون یافت نشد' },
      { status: 404 },
    );
  }

  // Authorization
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

  let body: { results?: Array<{ studentId: string; score?: number | null; rank?: number | null }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'بدنه درخواست نامعتبر است' },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.results)) {
    return NextResponse.json(
      { error: 'فیلد results باید یک آرایه باشد' },
      { status: 400 },
    );
  }

  // Validate each result entry
  const participantIds = new Set(existing.participants.map((p) => p.studentId));
  for (const r of body.results) {
    if (!r.studentId || typeof r.studentId !== 'string') {
      return NextResponse.json(
        { error: 'studentId الزامی است' },
        { status: 400 },
      );
    }
    if (!participantIds.has(r.studentId)) {
      return NextResponse.json(
        { error: `دانش‌آموز با شناسه ${r.studentId} در این آزمون ثبت‌نام نکرده است` },
        { status: 400 },
      );
    }
    if (r.score != null) {
      if (typeof r.score !== 'number' || r.score < 0 || r.score > existing.totalScore) {
        return NextResponse.json(
          { error: `نمره باید بین ۰ و ${existing.totalScore} باشد` },
          { status: 400 },
        );
      }
    }
    if (r.rank != null && (typeof r.rank !== 'number' || r.rank < 1)) {
      return NextResponse.json(
        { error: 'رتبه باید یک عدد صحیح مثبت باشد' },
        { status: 400 },
      );
    }
  }

  // Replace all results in a transaction:
  // 1. Delete existing results
  // 2. Insert new ones (only for entries that have a score OR rank)
  const validResults = body.results.filter(
    (r) => r.score != null || r.rank != null,
  );

  await db.$transaction(async (tx) => {
    await tx.examResult.deleteMany({ where: { examId: id } });
    if (validResults.length > 0) {
      await tx.examResult.createMany({
        data: validResults.map((r) => ({
          examId: id,
          studentId: r.studentId,
          score: r.score ?? null,
          rank: r.rank ?? null,
        })),
      });
    }

    // If at least one student has a score, mark the exam as completed
    const hasAnyScore = validResults.some((r) => r.score != null);
    if (hasAnyScore) {
      await tx.exam.update({
        where: { id },
        data: { status: 'completed' },
      });
    }
  });

  // Fetch the final state
  const saved = await db.examResult.findMany({
    where: { examId: id },
    select: { studentId: true, score: true, rank: true },
  });

  const results: ExamResult[] = saved.map((r) => ({
    studentId: r.studentId,
    score: r.score,
    rank: r.rank,
  }));

  return NextResponse.json({ results });
}

// =================================================================
// GET /api/exams/[id]/results
// Returns all results for an exam. Available to anyone who can see the
// exam (creator, super admin, institute manager, or participant student).
// =================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      instituteId: true,
      participants: { select: { studentId: true } },
      results: { select: { studentId: true, score: true, rank: true } },
    },
  });

  if (!exam) {
    return NextResponse.json(
      { error: 'آزمون یافت نشد' },
      { status: 404 },
    );
  }

  // Authorization: creator, super admin, institute manager, or participating student
  const isCreator = exam.createdById === ctx.userId;
  const isSuperAdmin = ctx.user.role === 'SUPER_ADMIN';
  const isManagerOfInstitute =
    ctx.user.role === 'INSTITUTE_MANAGER' &&
    exam.instituteId === ctx.user.instituteId;
  const isParticipant =
    ctx.user.role === 'STUDENT' &&
    exam.participants.some((p) => p.studentId === ctx.userId);

  if (!isCreator && !isSuperAdmin && !isManagerOfInstitute && !isParticipant) {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  // Students only see their own result
  let results = exam.results;
  if (isParticipant && !isCreator && !isSuperAdmin && !isManagerOfInstitute) {
    results = results.filter((r) => r.studentId === ctx.userId);
  }

  return NextResponse.json({
    results: results.map((r) => ({
      studentId: r.studentId,
      score: r.score,
      rank: r.rank,
    })),
  });
}
