// ===== Message Service =====
// Single source of truth for all message API operations.
// Follows the same pattern as task-service.ts.
//
// The Zustand store (refreshNotifications, markNotificationRead) calls these
// functions to fetch the student's DB-backed inbox and to persist read state.

import { apiFetch } from '@/lib/api-client';

// ===== InboxMessage =====
// A message addressed to the current student (or broadcast to all students).
export interface InboxMessage {
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: string | null;
  recipientId: string | null;
  title: string;
  body: string;
  createdAt: string; // ISO date string
  read: boolean;
}

// ===== SentMessage =====
// A message the current advisor/super-admin has sent.
export interface SentMessage {
  id: string;
  senderId: string;
  recipientId: string | null;
  title: string;
  body: string;
  createdAt: string; // ISO date string
  readCount: number; // number of students who've read it
}

// ===== Send Message Payload =====
export interface SendMessagePayload {
  recipientId: string | null;
  title: string;
  body: string;
}

// ===== Send Message Response =====
export interface SendMessageResponse {
  message: {
    id: string;
    senderId: string;
    recipientId: string | null;
    title: string;
    body: string;
    createdAt: string;
  };
  broadcastCount: number | null; // null = super-admin broadcast (true broadcast)
}

// ===== loadInboxMessages =====
// Fetch the current student's inbox (recipientId = me OR recipientId = null).
// Returns InboxMessage[] sorted by createdAt DESC.
export async function loadInboxMessages(): Promise<InboxMessage[]> {
  const res = await apiFetch('/api/messages', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری پیام‌ها');
  }
  const data = await res.json();
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return messages as InboxMessage[];
}

// ===== loadSentMessages =====
// Fetch messages the current advisor/super-admin has sent.
// Returns SentMessage[] sorted by createdAt DESC.
export async function loadSentMessages(): Promise<SentMessage[]> {
  const res = await apiFetch('/api/messages?sentBy=me', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در بارگذاری پیام‌های ارسالی');
  }
  const data = await res.json();
  const messages = Array.isArray(data.messages) ? data.messages : [];
  return messages as SentMessage[];
}

// ===== sendMessage =====
// Send a message. Returns the created message + broadcastCount.
export async function sendMessage(
  payload: SendMessagePayload,
): Promise<SendMessageResponse> {
  const res = await apiFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطا در ارسال پیام');
  }
  return (await res.json()) as SendMessageResponse;
}

// ===== markMessageRead =====
// Mark a message as read for the current student. Idempotent (uses upsert
// server-side). Fire-and-forget from the caller's perspective — errors
// are swallowed so they don't break the optimistic UI update.
export async function markMessageRead(messageId: string): Promise<void> {
  try {
    await apiFetch(`/api/messages/${messageId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Fire-and-forget — the optimistic UI state already reflects the read.
  }
}
