import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import { findActiveTopicMode, parsePositiveInteger, parseRequiredText } from '@/lib/curriculum-api';

type RouteContext = { params: Promise<{ subjectId: string; gradeSubjectId: string; modeId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId } = await params;
  const mode = await findActiveTopicMode(subjectId, gradeSubjectId, modeId);
  if (!mode) return NextResponse.json({ error: 'مبحث متعلق به این پایه نیست' }, { status: 404 });
  return NextResponse.json({ subtopics: mode.subtopics });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId } = await params;

  try {
    const mode = await findActiveTopicMode(subjectId, gradeSubjectId, modeId);
    if (!mode) return NextResponse.json({ error: 'مبحث متعلق به این پایه نیست' }, { status: 404 });
    const body = await request.json();
    const title = parseRequiredText(body.title, 'عنوان زیرمبحث');
    if ('error' in title) return NextResponse.json({ error: title.error }, { status: 400 });
    const requestedNo = body.subtopicNo === undefined ? null : parsePositiveInteger(body.subtopicNo);
    if (body.subtopicNo !== undefined && requestedNo === null) {
      return NextResponse.json({ error: 'شماره زیرمبحث باید عدد صحیح مثبت باشد' }, { status: 400 });
    }
    const last = requestedNo === null
      ? await db.topicModeSubtopic.findFirst({ where: { topicModeId: modeId, isActive: true }, orderBy: { subtopicNo: 'desc' }, select: { subtopicNo: true } })
      : null;
    const subtopicNo = requestedNo ?? (last?.subtopicNo ?? 0) + 1;
    const existing = await db.topicModeSubtopic.findUnique({ where: { topicModeId_subtopicNo: { topicModeId: modeId, subtopicNo } } });
    if (existing?.isActive) return NextResponse.json({ error: 'زیرمبحثی با این شماره قبلاً ثبت شده است' }, { status: 409 });

    const subtopic = existing
      ? await db.topicModeSubtopic.update({ where: { id: existing.id }, data: { title: title.value, sortOrder: subtopicNo, isActive: true } })
      : await db.topicModeSubtopic.create({ data: { topicModeId: modeId, title: title.value, subtopicNo, sortOrder: subtopicNo } });
    return NextResponse.json({ subtopic, reactivated: Boolean(existing) }, { status: existing ? 200 : 201 });
  } catch (cause) {
    console.error('POST topic-mode subtopic error:', cause);
    return NextResponse.json({ error: 'خطا در ایجاد زیرمبحث' }, { status: 500 });
  }
}
