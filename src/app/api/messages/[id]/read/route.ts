import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== PATCH /api/messages/[id]/read =====
// Marks a message as isRead: true for the recipient.
// Response shape: { ok: true, message }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const { id: messageId } = await params;

  if (!messageId) {
    return NextResponse.json(
      { error: 'شناسه پیام الزامی است' },
      { status: 400 },
    );
  }

  // Verify the message exists
  const message = await db.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return NextResponse.json(
      { error: 'پیام یافت نشد' },
      { status: 404 },
    );
  }

  // Only the receiver (or SUPER_ADMIN) can mark the message as read
  if (message.receiverId !== ctx.userId && ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز: شما گیرنده این پیام نیستید' },
      { status: 403 },
    );
  }

  if (message.isRead) {
    return NextResponse.json({ ok: true, message });
  }

  const updated = await db.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true, message: updated });
}
