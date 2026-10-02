import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== GET /api/messages =====
// - STUDENT: Returns the thread between student and their assigned advisor
// - ADVISOR: Returns threads grouped by student, or a specific student's thread if ?studentId=...
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  const { searchParams } = new URL(request.url);
  const studentIdParam = searchParams.get('studentId');

  // ===== STUDENT =====
  if (ctx.user.role === 'STUDENT') {
    const student = await db.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        assignedAdvisorId: true,
        assignedAdvisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!student?.assignedAdvisorId || !student.assignedAdvisor) {
      return NextResponse.json({
        messages: [],
        advisor: null,
        hasAdvisor: false,
      });
    }

    const advisorId = student.assignedAdvisorId;

    const messages = await db.message.findMany({
      where: {
        deletedAt: null,
        OR: [
          { senderId: ctx.userId, receiverId: advisorId },
          { senderId: advisorId, receiverId: ctx.userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({
      messages,
      advisor: student.assignedAdvisor,
      hasAdvisor: true,
    });
  }

  // ===== ADVISOR =====
  if (ctx.user.role === 'ADVISOR') {
    // If querying a single student thread
    if (studentIdParam) {
      const messages = await db.message.findMany({
        where: {
          deletedAt: null,
          OR: [
            { senderId: ctx.userId, receiverId: studentIdParam },
            { senderId: studentIdParam, receiverId: ctx.userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
          },
        },
      });

      const student = await db.user.findUnique({
        where: { id: studentIdParam },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          grade: true,
          major: true,
        },
      });

      return NextResponse.json({
        messages,
        student,
      });
    }

    // Otherwise, fetch all assigned students and messages to group by student
    const assignedStudents = await db.user.findMany({
      where: { assignedAdvisorId: ctx.userId, role: 'STUDENT', deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        grade: true,
        major: true,
      },
    });

    const allMessages = await db.message.findMany({
      where: {
        deletedAt: null,
        OR: [
          { senderId: ctx.userId },
          { receiverId: ctx.userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
    });

    // Group messages by student
    const studentMap = new Map<string, {
      student: { id: string; firstName: string; lastName: string | null; avatar: string; grade?: string | null; major?: string | null };
      messages: typeof allMessages;
      lastMessage: (typeof allMessages)[0] | null;
      unreadCount: number;
    }>();

    // Initialize all assigned students
    for (const s of assignedStudents) {
      studentMap.set(s.id, {
        student: s,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      });
    }

    // Populate messages
    for (const msg of allMessages) {
      const otherId = msg.senderId === ctx.userId ? msg.receiverId : msg.senderId;
      if (!studentMap.has(otherId)) {
        const studentInfo = msg.senderId === otherId ? msg.sender : msg.receiver;
        studentMap.set(otherId, {
          student: {
            id: otherId,
            firstName: studentInfo.firstName,
            lastName: studentInfo.lastName,
            avatar: studentInfo.avatar,
          },
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        });
      }

      const thread = studentMap.get(otherId)!;
      thread.messages.push(msg);
      if (!thread.lastMessage) {
        thread.lastMessage = msg;
      }
      if (msg.receiverId === ctx.userId && !msg.isRead) {
        thread.unreadCount += 1;
      }
    }

    // Sort messages in each thread ascending (oldest to newest)
    for (const thread of studentMap.values()) {
      thread.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    // Sort threads: those with unread messages first, then by lastMessage createdAt desc
    const threads = Array.from(studentMap.values()).sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      const timeA = a.lastMessage ? a.lastMessage.createdAt.getTime() : 0;
      const timeB = b.lastMessage ? b.lastMessage.createdAt.getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({
      threads,
      assignedStudents,
    });
  }

  // ===== SUPER_ADMIN (Fallback / Overview) =====
  const messages = await db.message.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
    },
  });

  return NextResponse.json({ messages });
}

// ===== POST /api/messages =====
// Send a message between Student and Advisor
export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  try {
    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : null;
    let receiverId: string | null = typeof body.receiverId === 'string' ? body.receiverId.trim() : null;

    if (!content) {
      return NextResponse.json({ error: 'متن پیام الزامی است' }, { status: 400 });
    }

    if (content.length > 3000) {
      return NextResponse.json({ error: 'متن پیام حداکثر ۳۰۰۰ نویسه است' }, { status: 400 });
    }

    // STUDENT sending to Advisor
    if (ctx.user.role === 'STUDENT') {
      const student = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { assignedAdvisorId: true },
      });

      if (!student?.assignedAdvisorId) {
        return NextResponse.json(
          { error: 'شما هنوز مشاوری ندارید. لطفاً ابتدا مشاور انتخاب کنید' },
          { status: 400 },
        );
      }

      receiverId = student.assignedAdvisorId;
    } else if (ctx.user.role === 'ADVISOR') {
      if (!receiverId) {
        return NextResponse.json({ error: 'شناسه دانش‌آموز الزامی است' }, { status: 400 });
      }

      const targetStudent = await db.user.findUnique({
        where: { id: receiverId },
        select: { id: true, assignedAdvisorId: true, role: true },
      });

      if (!targetStudent || targetStudent.role !== 'STUDENT') {
        return NextResponse.json({ error: 'دانش‌آموز یافت نشد' }, { status: 404 });
      }
    } else if (ctx.user.role === 'SUPER_ADMIN') {
      if (!receiverId) {
        return NextResponse.json({ error: 'گیرنده پیام الزامی است' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const message = await db.message.create({
      data: {
        senderId: ctx.userId,
        receiverId,
        subject,
        content,
        isRead: false,
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

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('Error creating message:', err);
    return NextResponse.json({ error: 'خطا در ثبت پیام' }, { status: 500 });
  }
}
