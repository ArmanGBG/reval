import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { findActiveTopicMode, parseNonNegativeInteger, parseNullableText, parsePositiveInteger, parseRequiredText, syncTopicModeTaskSummaries } from '@/lib/curriculum-api';

type RouteContext = { params: Promise<{ subjectId: string; gradeSubjectId: string; modeId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId } = await params;

  try {
    const existing = await findActiveTopicMode(subjectId, gradeSubjectId, modeId);
    if (!existing) return NextResponse.json({ error: 'مبحث متعلق به این پایه نیست' }, { status: 404 });
    const body = await request.json();
    const data: { title?: string; description?: string | null; modeNo?: number; sortOrder?: number } = {};

    if (body.title !== undefined) {
      const title = parseRequiredText(body.title, 'عنوان مبحث');
      if ('error' in title) return NextResponse.json({ error: title.error }, { status: 400 });
      data.title = title.value;
    }
    if (body.description !== undefined) {
      const description = parseNullableText(body.description);
      if (description === undefined) return NextResponse.json({ error: 'توضیحات باید متن یا null باشد' }, { status: 400 });
      data.description = description;
    }
    if (body.modeNo !== undefined) {
      const modeNo = parsePositiveInteger(body.modeNo);
      if (modeNo === null) return NextResponse.json({ error: 'شماره مبحث باید عدد صحیح مثبت باشد' }, { status: 400 });
      if (modeNo !== existing.modeNo) {
        const conflict = await db.topicMode.findUnique({ where: { gradeSubjectId_modeNo: { gradeSubjectId, modeNo } } });
        if (conflict) return NextResponse.json({ error: 'مبحثی با این شماره قبلاً ثبت شده است' }, { status: 409 });
      }
      data.modeNo = modeNo;
    }
    if (body.sortOrder !== undefined) {
      const sortOrder = parseNonNegativeInteger(body.sortOrder);
      if (sortOrder === null) return NextResponse.json({ error: 'ترتیب باید عدد صحیح نامنفی باشد' }, { status: 400 });
      data.sortOrder = sortOrder;
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'هیچ تغییری ارسال نشده است' }, { status: 400 });

    const topicMode = await db.topicMode.update({ where: { id: modeId }, data });
    if (data.title !== undefined) await syncTopicModeTaskSummaries(modeId);
    return NextResponse.json({ topicMode: await db.topicMode.findUnique({ where: { id: topicMode.id }, include: { subtopics: { where: { isActive: true }, orderBy: { subtopicNo: 'asc' } } } }) });
  } catch (cause) {
    console.error('PATCH grade-scoped topic-mode error:', cause);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی مبحث' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireRole(request, ['SUPER_ADMIN']);
  if (error) return error;
  const { subjectId, gradeSubjectId, modeId } = await params;

  try {
    const existing = await findActiveTopicMode(subjectId, gradeSubjectId, modeId);
    if (!existing) return NextResponse.json({ error: 'مبحث متعلق به این پایه نیست' }, { status: 404 });
    await db.$transaction([
      db.topicMode.update({ where: { id: modeId }, data: { isActive: false } }),
      db.topicModeSubtopic.updateMany({ where: { topicModeId: modeId, isActive: true }, data: { isActive: false } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error('DELETE grade-scoped topic-mode error:', cause);
    return NextResponse.json({ error: 'خطا در حذف مبحث' }, { status: 500 });
  }
}
