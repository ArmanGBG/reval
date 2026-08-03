import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH grade-subject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gradeSubjectId: string }> }
) {
  const { gradeSubjectId } = await params;
  try {
    const body = await request.json();
    const allowed = ['depth', 'allowOptionalSubtopic', 'sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const gradeSubject = await db.gradeSubject.update({ where: { id: gradeSubjectId }, data });
    return NextResponse.json({ gradeSubject });
  } catch (error) {
    console.error('PATCH grade-subject error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی پایه' }, { status: 500 });
  }
}

// DELETE grade-subject — soft delete
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ gradeSubjectId: string }> }
) {
  const { gradeSubjectId } = await params;
  try {
    await db.gradeSubject.update({ where: { id: gradeSubjectId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE grade-subject error:', error);
    return NextResponse.json({ error: 'خطا در حذف پایه' }, { status: 500 });
  }
}
