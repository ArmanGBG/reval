import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH topic
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  try {
    const body = await request.json();
    const allowed = ['title', 'topicNo', 'sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const topic = await db.topic.update({ where: { id: topicId }, data });
    return NextResponse.json({ topic });
  } catch (error) {
    console.error('PATCH topic error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی گفتار' }, { status: 500 });
  }
}

// DELETE topic — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;
  try {
    await db.topic.update({ where: { id: topicId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE topic error:', error);
    return NextResponse.json({ error: 'خطا در حذف گفتار' }, { status: 500 });
  }
}
