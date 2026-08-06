import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';

// ===== GET /api/messages =====
// Two modes:
//   1. STUDENT (default) — returns the student's inbox: messages where
//      recipientId === ctx.userId OR recipientId === null (broadcast).
//      Includes a `read` boolean (true if a MessageRead exists for this user).
//      Sorted by createdAt DESC.
//   2. ADVISOR / SUPER_ADMIN with `?sentBy=me` — returns messages the
//      current user sent (senderId === ctx.userId). Sorted by createdAt DESC.
//
// Response shape: { messages: MessageRow[] }
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const { searchParams } = new URL(request.url);
  const sentByMe = searchParams.get('sentBy') === 'me';

  // ===== Mode 2: sent messages (advisor / super-admin only) =====
  if (sentByMe) {
    if (ctx.user.role !== 'ADVISOR' && ctx.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 },
      );
    }
    const sent = await db.message.findMany({
      where: { senderId: ctx.userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        title: true,
        body: true,
        createdAt: true,
        readBy: { select: { userId: true } },
      },
    });
    const messages = sent.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      recipientId: m.recipientId,
      title: m.title,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readCount: m.readBy.length,
    }));
    return NextResponse.json({ messages });
  }

  // ===== Mode 1: inbox — only students have an inbox =====
  if (ctx.user.role !== 'STUDENT') {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  const rows = await db.message.findMany({
    where: {
      OR: [
        { recipientId: ctx.userId },
        { recipientId: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      title: true,
      body: true,
      createdAt: true,
      sender: { select: { id: true, name: true, role: true } },
      readBy: { where: { userId: ctx.userId }, select: { userId: true } },
    },
  });

  const messages = rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender?.name ?? null,
    senderRole: m.sender?.role ?? null,
    recipientId: m.recipientId,
    title: m.title,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    read: m.readBy.length > 0,
  }));

  return NextResponse.json({ messages });
}

// ===== POST /api/messages =====
// Send a message. Body: { recipientId: string | null, title: string, body: string }
//
// Authorization:
//   - ADVISOR: recipientId must be one of their assigned students.
//              If recipientId === null (broadcast), creates one Message
//              row PER assigned student so the student inbox query finds them.
//   - SUPER_ADMIN: recipientId can be any student OR null (true broadcast —
//                  one Message row with recipientId=null).
//
// Validation:
//   - title: non-empty, max 120 chars
//   - body: non-empty, max 2000 chars
export async function POST(request: NextRequest) {
  const { ctx, error } = await requireRole(request, ['ADVISOR', 'SUPER_ADMIN']);
  if (error || !ctx) return error;

  try {
    const body = await request.json();
    const title: unknown = body.title;
    const messageBody: unknown = body.body;
    const recipientId: unknown = body.recipientId;

    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 120) {
      return NextResponse.json(
        { error: 'عنوان پیام الزامی است و حداکثر ۱۲۰ نویسه است' },
        { status: 400 },
      );
    }
    if (typeof messageBody !== 'string' || messageBody.trim().length === 0 || messageBody.length > 2000) {
      return NextResponse.json(
        { error: 'متن پیام الزامی است و حداکثر ۲۰۰۰ نویسه است' },
        { status: 400 },
      );
    }
    if (recipientId !== null && typeof recipientId !== 'string') {
      return NextResponse.json(
        { error: 'گیرنده نامعتبر است' },
        { status: 400 },
      );
    }

    const cleanTitle = title.trim();
    const cleanBody = messageBody.trim();

    if (ctx.user.role === 'ADVISOR') {
      // Advisor broadcast: send to ALL assigned students (one Message per student)
      if (recipientId === null) {
        const assignedStudents = await db.user.findMany({
          where: { assignedAdvisorId: ctx.userId, role: 'STUDENT', isActive: true },
          select: { id: true },
        });
        if (assignedStudents.length === 0) {
          return NextResponse.json(
            { error: 'هیچ دانش‌آموزی به شما اختصاص داده نشده است' },
            { status: 400 },
          );
        }
        // Create one Message per assigned student
        const created = await db.$transaction(
          assignedStudents.map((s) =>
            db.message.create({
              data: {
                senderId: ctx.userId,
                recipientId: s.id,
                title: cleanTitle,
                body: cleanBody,
              },
            }),
          ),
        );
        const first = created[0];
        return NextResponse.json(
          {
            message: {
              id: first.id,
              senderId: first.senderId,
              recipientId: first.recipientId,
              title: first.title,
              body: first.body,
              createdAt: first.createdAt.toISOString(),
            },
            broadcastCount: created.length,
          },
          { status: 201 },
        );
      }

      // Advisor → single student: verify ownership
      const student = await db.user.findUnique({
        where: { id: recipientId },
        select: { id: true, role: true, assignedAdvisorId: true },
      });
      if (!student || student.role !== 'STUDENT' || student.assignedAdvisorId !== ctx.userId) {
        return NextResponse.json(
          { error: 'این دانش‌آموز به شما اختصاص ندارد' },
          { status: 403 },
        );
      }
      const created = await db.message.create({
        data: {
          senderId: ctx.userId,
          recipientId: student.id,
          title: cleanTitle,
          body: cleanBody,
        },
      });
      return NextResponse.json(
        {
          message: {
            id: created.id,
            senderId: created.senderId,
            recipientId: created.recipientId,
            title: created.title,
            body: created.body,
            createdAt: created.createdAt.toISOString(),
          },
          broadcastCount: 1,
        },
        { status: 201 },
      );
    }

    // SUPER_ADMIN
    if (recipientId === null) {
      // True broadcast — single Message row with recipientId=null
      const created = await db.message.create({
        data: {
          senderId: ctx.userId,
          recipientId: null,
          title: cleanTitle,
          body: cleanBody,
        },
      });
      return NextResponse.json(
        {
          message: {
            id: created.id,
            senderId: created.senderId,
            recipientId: created.recipientId,
            title: created.title,
            body: created.body,
            createdAt: created.createdAt.toISOString(),
          },
          broadcastCount: null,
        },
        { status: 201 },
      );
    }

    // Super-admin → specific student
    const student = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'دانش‌آموز یافت نشد' },
        { status: 404 },
      );
    }
    const created = await db.message.create({
      data: {
        senderId: ctx.userId,
        recipientId: student.id,
        title: cleanTitle,
        body: cleanBody,
      },
    });
    return NextResponse.json(
      {
        message: {
          id: created.id,
          senderId: created.senderId,
          recipientId: created.recipientId,
          title: created.title,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
        },
        broadcastCount: 1,
      },
      { status: 201 },
    );
  } catch (cause) {
    console.error('POST /api/messages error:', cause);
    return NextResponse.json(
      { error: 'خطا در ارسال پیام' },
      { status: 500 },
    );
  }
}
