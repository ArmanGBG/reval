import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { findActiveTopicMode, parseNonNegativeInteger, parsePositiveInteger, parseRequiredText, syncTopicModeTaskSummaries } from '@/lib/curriculum-api';

type RouteContext = { params: Promise<{ subjectId: string; gradeSubjectId: string; modeId: string; subtopicId: string }> };

async function findOwnedSubtopic(subjectId: string, gradeSubjectId: string, modeId: string, subtopicId: string) {
  const mode = await findActiveTopicMode(subjectId, gradeSubjectId, modeId);
  if (!mode) return null;
  const subtopic = mode.subtopics.find((item) => item.id === subtopicId);
  return subtopic ? { mode, subtopic } : null;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId, subtopicId } = await params;

  try {
    const owned = await findOwnedSubtopic(subjectId, gradeSubjectId, modeId, subtopicId);
    if (!owned) return NextResponse.json({ error: 'زیرمبحث متعلق به این مبحث نیست' }, { status: 404 });
    const body = await request.json();
    const data: { title?: string; subtopicNo?: number; sortOrder?: number } = {};
    if (body.title !== undefined) {
      const title = parseRequiredText(body.title, 'عنوان زیرمبحث');
      if ('error' in title) return NextResponse.json({ error: title.error }, { status: 400 });
      data.title = title.value;
    }
    if (body.subtopicNo !== undefined) {
      const subtopicNo = parsePositiveInteger(body.subtopicNo);
      if (subtopicNo === null) return NextResponse.json({ error: 'شماره زیرمبحث باید عدد صحیح مثبت باشد' }, { status: 400 });
      if (subtopicNo !== owned.subtopic.subtopicNo) {
        const conflict = await db.topicModeSubtopic.findUnique({ where: { topicModeId_subtopicNo: { topicModeId: modeId, subtopicNo } } });
        if (conflict) return NextResponse.json({ error: 'زیرمبحثی با این شماره قبلاً ثبت شده است' }, { status: 409 });
      }
      data.subtopicNo = subtopicNo;
    }
    if (body.sortOrder !== undefined) {
      const sortOrder = parseNonNegativeInteger(body.sortOrder);
      if (sortOrder === null) return NextResponse.json({ error: 'ترتیب باید عدد صحیح نامنفی باشد' }, { status: 400 });
      data.sortOrder = sortOrder;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'هیچ تغییری ارسال نشده است' }, { status: 400 });
    const subtopic = await db.topicModeSubtopic.update({ where: { id: subtopicId }, data });
    if (data.title !== undefined) await syncTopicModeTaskSummaries(modeId);
    return NextResponse.json({ subtopic });
  } catch (cause) {
    console.error('PATCH topic-mode subtopic error:', cause);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی زیرمبحث' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId, subtopicId } = await params;
  const owned = await findOwnedSubtopic(subjectId, gradeSubjectId, modeId, subtopicId);
  if (!owned) return NextResponse.json({ error: 'زیرمبحث متعلق به این مبحث نیست' }, { status: 404 });
  try {
    await db.topicModeSubtopic.update({ where: { id: subtopicId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error('DELETE topic-mode subtopic error:', cause);
    return NextResponse.json({ error: 'خطا در حذف زیرمبحث' }, { status: 500 });
  }
}
