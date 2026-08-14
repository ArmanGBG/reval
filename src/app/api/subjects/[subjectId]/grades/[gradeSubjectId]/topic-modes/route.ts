import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { findActiveGradeSubject, parseNullableText, parsePositiveInteger, parseRequiredText } from '@/lib/curriculum-api';

type RouteContext = { params: Promise<{ subjectId: string; gradeSubjectId: string }> };

async function getModeWithActiveSubtopics(modeId: string) {
  return db.topicMode.findUnique({
    where: { id: modeId },
    include: { subtopics: { where: { isActive: true }, orderBy: { subtopicNo: 'asc' } } },
  });
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { subjectId, gradeSubjectId } = await params;
  const gradeSubject = await findActiveGradeSubject(subjectId, gradeSubjectId);
  if (!gradeSubject) return NextResponse.json({ error: 'پایه متعلق به این درس نیست' }, { status: 404 });

  const topicModes = await db.topicMode.findMany({
    where: { gradeSubjectId, isActive: true },
    orderBy: { modeNo: 'asc' },
    include: { subtopics: { where: { isActive: true }, orderBy: { subtopicNo: 'asc' } } },
  });
  return NextResponse.json({ topicModes });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId } = await params;

  try {
    const gradeSubject = await findActiveGradeSubject(subjectId, gradeSubjectId);
    if (!gradeSubject) return NextResponse.json({ error: 'پایه متعلق به این درس نیست' }, { status: 404 });
    const body = await request.json();
    const title = parseRequiredText(body.title, 'عنوان مبحث');
    if ('error' in title) return NextResponse.json({ error: title.error }, { status: 400 });

    const description = parseNullableText(body.description);
    if (body.description !== undefined && description === undefined) {
      return NextResponse.json({ error: 'توضیحات باید متن یا null باشد' }, { status: 400 });
    }
    const requestedNo = body.modeNo === undefined ? null : parsePositiveInteger(body.modeNo);
    if (body.modeNo !== undefined && requestedNo === null) {
      return NextResponse.json({ error: 'شماره مبحث باید عدد صحیح مثبت باشد' }, { status: 400 });
    }

    const last = requestedNo === null
      ? await db.topicMode.findFirst({ where: { gradeSubjectId, isActive: true }, orderBy: { modeNo: 'desc' }, select: { modeNo: true } })
      : null;
    const modeNo = requestedNo ?? (last?.modeNo ?? 0) + 1;
    const existing = await db.topicMode.findUnique({ where: { gradeSubjectId_modeNo: { gradeSubjectId, modeNo } } });
    if (existing?.isActive) return NextResponse.json({ error: 'مبحثی با این شماره قبلاً ثبت شده است' }, { status: 409 });

    const topicMode = existing
      ? await db.topicMode.update({
          where: { id: existing.id },
          data: { title: title.value, description: description ?? null, sortOrder: modeNo, isActive: true },
        })
      : await db.topicMode.create({
          data: { gradeSubjectId, title: title.value, description: description ?? null, modeNo, sortOrder: modeNo },
        });
    return NextResponse.json(
      { topicMode: await getModeWithActiveSubtopics(topicMode.id), reactivated: Boolean(existing) },
      { status: existing ? 200 : 201 },
    );
  } catch (cause) {
    console.error('POST grade-scoped topic-mode error:', cause);
    return NextResponse.json({ error: 'خطا در ایجاد مبحث' }, { status: 500 });
  }
}
