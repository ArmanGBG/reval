import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

// PATCH topic-mode
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ modeId: string }> }
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { modeId } = await params;
  try {
    const body = await request.json();
    const allowed = ['title', 'description', 'modeNo', 'sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const topicMode = await db.$transaction(async (tx) => {
      const updated = await tx.topicMode.update({ where: { id: modeId }, data });
      if (typeof data.title === 'string') {
        await tx.task.updateMany({
          where: { topicModeId: modeId },
          data: { topic: updated.title },
        });
      }
      return updated;
    });
    return NextResponse.json({ topicMode });
  } catch (error) {
    console.error('PATCH topic-mode error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی مبحث' }, { status: 500 });
  }
}

// DELETE topic-mode — soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modeId: string }> }
) {
  const { error: authError } = await requireRole(request, ['SUPER_ADMIN']);
  if (authError) return authError;

  const { modeId } = await params;
  try {
    await db.topicMode.update({ where: { id: modeId }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE topic-mode error:', error);
    return NextResponse.json({ error: 'خطا در حذف مبحث' }, { status: 500 });
  }
}
