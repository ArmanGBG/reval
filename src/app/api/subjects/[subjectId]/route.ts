import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/subjects/:subjectId  — single subject with full tree
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  const subject = await db.subject.findUnique({
    where: { id: subjectId },
    include: {
      grades: { orderBy: { sortOrder: 'asc' } },
      chapters: {
        orderBy: [{ grade: 'asc' }, { chapterNo: 'asc' }],
        include: { topics: { orderBy: { topicNo: 'asc' } } },
      },
      topicModes: { orderBy: { modeNo: 'asc' } },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: 'درس یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ subject });
}

// PATCH /api/subjects/:subjectId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  try {
    const body = await request.json();
    const allowed = ['name', 'color', 'icon', 'sortOrder', 'assessmentType', 'displayStrategy', 'category', 'finalStrategy', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده' }, { status: 400 });
    }

    // If renaming, ensure uniqueness
    if (typeof data.name === 'string') {
      const clash = await db.subject.findUnique({ where: { name: data.name } });
      if (clash && clash.id !== subjectId) {
        return NextResponse.json({ error: 'نام درس تکراری است' }, { status: 409 });
      }
    }

    const subject = await db.subject.update({ where: { id: subjectId }, data });
    return NextResponse.json({ subject });
  } catch (error) {
    console.error('PATCH subject error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی درس' }, { status: 500 });
  }
}

// DELETE /api/subjects/:subjectId — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  const { subjectId } = await params;
  try {
    await db.subject.update({ where: { id: subjectId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE subject error:', error);
    return NextResponse.json({ error: 'خطا در حذف درس' }, { status: 500 });
  }
}
