import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== PATCH /api/messages/[id]/read =====
// Marks a message as read for the current user (STUDENT only).
// Verifies the message is addressed to the student (recipientId === userId
// OR recipientId === null for broadcasts). Uses upsert so calling it twice
// is idempotent.
//
// Response shape: { ok: true }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  if (ctx.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  const { id: messageId } = await params;

  // Verify the message exists and is addressed to this student
  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { id: true, recipientId: true },
  });

  if (!message) {
    return NextResponse.json(
      { error: 'پیام یافت نشد' },
      { status: 404 },
    );
  }

  if (message.recipientId !== null && message.recipientId !== ctx.userId) {
    return NextResponse.json(
      { error: 'این پیام به شما ارسال نشده است' },
      { status: 403 },
    );
  }

  // Upsert the MessageRead record (idempotent)
  await db.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId: ctx.userId,
      },
    },
    create: {
      messageId,
      userId: ctx.userId,
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
