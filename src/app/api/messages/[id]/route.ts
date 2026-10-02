import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== PATCH /api/messages/[id] =====
// Updates message content and sets isEdited: true. Only the sender can edit.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const { id: messageId } = await params;
  if (!messageId) {
    return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'فرمت داده نامعتبر است' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return NextResponse.json({ error: 'متن پیام الزامی است' }, { status: 400 });
  }

  if (content.length > 3000) {
    return NextResponse.json({ error: 'متن پیام حداکثر ۳۰۰۰ نویسه است' }, { status: 400 });
  }

  const message = await db.message.findFirst({
    where: {
      id: messageId,
      deletedAt: null,
    },
  });

  if (!message) {
    return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 });
  }

  if (message.senderId !== ctx.userId) {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز: تنها فرستنده پیام می‌تواند آن را ویرایش کند' },
      { status: 403 },
    );
  }

  const updated = await db.message.update({
    where: { id: messageId },
    data: {
      content,
      isEdited: true,
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
      },
      receiver: {
        select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
      },
    },
  });

  return NextResponse.json({ message: updated });
}

// ===== DELETE /api/messages/[id] =====
// Soft-deletes a message by setting deletedAt to new Date(). Only the sender can delete.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const { id: messageId } = await params;
  if (!messageId) {
    return NextResponse.json({ error: 'شناسه پیام الزامی است' }, { status: 400 });
  }

  const message = await db.message.findFirst({
    where: {
      id: messageId,
      deletedAt: null,
    },
  });

  if (!message) {
    return NextResponse.json({ error: 'پیام یافت نشد' }, { status: 404 });
  }

  if (message.senderId !== ctx.userId && ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز: تنها فرستنده پیام می‌تواند آن را حذف کند' },
      { status: 403 },
    );
  }

  await db.message.update({
    where: { id: messageId },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
