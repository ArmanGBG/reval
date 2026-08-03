import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/subjects/:subjectId/chapters/:chapterId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> }
) {
  const { chapterId } = await params;
  try {
    const body = await request.json();
    const allowed = ['title', 'chapterNo', 'grade', 'assessmentType', 'weight', 'sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'فیلدی برای به‌روزرسانی ارسال نشده' }, { status: 400 });
    }

    const chapter = await db.chapter.update({ where: { id: chapterId }, data });
    return NextResponse.json({ chapter });
  } catch (error) {
    console.error('PATCH chapter error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی فصل' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId/chapters/:chapterId — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string; chapterId: string }> }
) {
  const { chapterId } = await params;
  try {
    await db.chapter.update({ where: { id: chapterId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE chapter error:', error);
    return NextResponse.json({ error: 'خطا در حذف فصل' }, { status: 500 });
  }
}
