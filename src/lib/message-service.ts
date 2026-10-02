// ===== Message Service =====
// Single source of truth for all student-advisor messaging operations.
// Follows the same pattern as task-service.ts.

import { apiFetch } from '@/lib/api-client';

export interface MessageSenderReceiver {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string;
  role: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  isEdited?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  sender?: MessageSenderReceiver;
  receiver?: MessageSenderReceiver;
}

export interface StudentAdvisorInfo {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string;
  role: string;
  grade?: string | null;
  major?: string | null;
}

export interface StudentThreadResponse {
  messages: MessageItem[];
  advisor: StudentAdvisorInfo | null;
  hasAdvisor: boolean;
}

export interface AdvisorThread {
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string;
    grade?: string | null;
    major?: string | null;
  };
  messages: MessageItem[];
  lastMessage: MessageItem | null;
  unreadCount: number;
}

export interface AdvisorThreadsResponse {
  threads: AdvisorThread[];
  assignedStudents: StudentAdvisorInfo[];
}

// ===== Legacy Types for Compatibility =====
export interface InboxMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: string | null;
  recipientId: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface SentMessage {
  id: string;
  senderId: string;
  recipientId: string | null;
  title: string;
  body: string;
  createdAt: string;
  readCount: number;
}

// ===== API Methods =====

/**
 * Fetch thread between logged-in student and their advisor
 */
export async function getStudentThread(): Promise<StudentThreadResponse> {
  const res = await apiFetch('/api/messages', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری پیام‌ها');
  }
  return res.json();
}

/**
 * Fetch threads for advisor (grouped by student)
 */
export async function getAdvisorThreads(): Promise<AdvisorThreadsResponse> {
  const res = await apiFetch('/api/messages', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری گفتگوها');
  }
  return res.json();
}

/**
 * Fetch messages with a specific student for advisor
 */
export async function getAdvisorStudentMessages(
  studentId: string,
): Promise<{ messages: MessageItem[]; student: StudentAdvisorInfo | null }> {
  const res = await apiFetch(`/api/messages?studentId=${encodeURIComponent(studentId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری پیام‌های دانش‌آموز');
  }
  return res.json();
}

/**
 * Send a message (student -> advisor OR advisor -> student)
 */
export async function sendMessage(payload: {
  receiverId?: string | null;
  recipientId?: string | null;
  subject?: string | null;
  title?: string | null;
  content?: string;
  body?: string;
}): Promise<{ message: MessageItem }> {
  const effectiveReceiverId = payload.receiverId || payload.recipientId || undefined;
  const effectiveSubject = payload.subject || payload.title || undefined;
  const effectiveContent = payload.content || payload.body || '';

  const res = await apiFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      receiverId: effectiveReceiverId,
      subject: effectiveSubject,
      content: effectiveContent,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در ارسال پیام');
  }
  return res.json();
}

/**
 * Mark a message as read (PATCH /api/messages/[id]/read)
 */
export async function markMessageRead(
  messageId: string,
): Promise<{ ok: boolean; message?: MessageItem }> {
  try {
    const res = await apiFetch(`/api/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false };
    }
    return res.json();
  } catch {
    return { ok: false };
  }
}

/**
 * Edit a message (PATCH /api/messages/[id])
 */
export async function editMessage(
  messageId: string,
  content: string,
): Promise<{ message: MessageItem }> {
  const res = await apiFetch(`/api/messages/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در ویرایش پیام');
  }
  return res.json();
}

/**
 * Delete a message (DELETE /api/messages/[id])
 */
export async function deleteMessage(
  messageId: string,
): Promise<{ ok: boolean }> {
  const res = await apiFetch(`/api/messages/${messageId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در حذف پیام');
  }
  return res.json();
}

// ===== Backwards Compatibility Methods =====

export async function loadInboxMessages(): Promise<InboxMessage[]> {
  try {
    const data = await getStudentThread();
    if (!data.messages) return [];
    return data.messages
      .filter((m) => m.sender?.role === 'ADVISOR' || m.sender?.role === 'SUPER_ADMIN')
      .map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim() || 'مشاور',
        senderRole: m.sender?.role || 'ADVISOR',
        recipientId: m.receiverId,
        title: m.subject || 'پیام از مشاور',
        body: m.content,
        createdAt: m.createdAt,
        read: m.isRead,
      }));
  } catch {
    return [];
  }
}

export async function loadSentMessages(): Promise<SentMessage[]> {
  try {
    const res = await apiFetch('/api/messages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.threads && Array.isArray(data.threads)) {
      const sent: SentMessage[] = [];
      for (const t of data.threads) {
        for (const m of t.messages) {
          if (m.sender?.role === 'ADVISOR') {
            sent.push({
              id: m.id,
              senderId: m.senderId,
              recipientId: m.receiverId,
              title: m.subject || 'پیام',
              body: m.content,
              createdAt: m.createdAt,
              readCount: m.isRead ? 1 : 0,
            });
          }
        }
      }
      return sent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch {
    return [];
  }
}
