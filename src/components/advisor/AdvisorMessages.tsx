'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Loader2, Inbox, Users, CheckCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toPersianDigits } from '@/lib/persian-date';
import * as messageService from '@/lib/message-service';
import { toast } from 'sonner';

interface StudentOption {
  id: string;
  name: string;
  avatar: string;
}

interface SentMessageRow {
  id: string;
  recipientId: string | null;
  title: string;
  body: string;
  createdAt: string;
  readCount: number;
}

// Format an ISO date string to Persian relative time
function relativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  if (diffH < 24) return `${toPersianDigits(diffH)} ساعت پیش`;
  return `${toPersianDigits(diffD)} روز پیش`;
}

export default function AdvisorMessages() {
  const { user, advisorStudents, loadAdvisorStudents } = useAppStore();
  const advisorId = user?.id;

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [recipientId, setRecipientId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const [sent, setSent] = useState<SentMessageRow[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);

  // ===== Load advisor's students (from store cache or API) =====
  useEffect(() => {
    let mounted = true;
    setLoadingStudents(true);
    (async () => {
      try {
        if (!advisorId) return;
        // Use cached advisorStudents if present, else fetch
        if (advisorStudents.length === 0) {
          await loadAdvisorStudents(advisorId);
        }
        if (!mounted) return;
        // Read fresh from store
        const fresh = useAppStore.getState().advisorStudents;
        setStudents(
          fresh.map((s) => ({ id: s.id, name: s.name, avatar: s.avatar })),
        );
      } catch {
        // Ignore — UI shows empty list
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [advisorId, advisorStudents.length, loadAdvisorStudents]);

  // ===== Load recently sent messages =====
  const refreshSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const rows = await messageService.loadSentMessages();
      setSent(rows as SentMessageRow[]);
    } catch (err) {
      // Ignore — UI shows empty state
    } finally {
      setLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    void refreshSent();
  }, [refreshSent]);

  // ===== Send handler =====
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('عنوان و متن پیام الزامی است');
      return;
    }
    if (title.length > 120) {
      toast.error('عنوان حداکثر ۱۲۰ نویسه است');
      return;
    }
    if (body.length > 2000) {
      toast.error('متن پیام حداکثر ۲۰۰۰ نویسه است');
      return;
    }
    // Empty string → null (broadcast to all assigned students)
    const targetRecipient = recipientId === '' ? null : recipientId;

    setSending(true);
    try {
      const result = await messageService.sendMessage({
        recipientId: targetRecipient,
        title: title.trim(),
        body: body.trim(),
      });
      const count = result.broadcastCount;
      const recipientLabel =
        targetRecipient === null
          ? count
            ? `همه دانش‌آموزان (${toPersianDigits(count)} نفر)`
            : 'همه دانش‌آموزان'
          : students.find((s) => s.id === targetRecipient)?.name || 'دانش‌آموز';
      toast.success(`پیام به «${recipientLabel}» ارسال شد`);
      // Reset form
      setTitle('');
      setBody('');
      setRecipientId('');
      // Refresh sent list
      void refreshSent();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ارسال پیام';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      {/* ============ Page Header ============ */}
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)] leading-tight">پیام‌رسانی</h1>
            <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">
              ارسال پیام به دانش‌آموزانت
            </p>
          </div>
        </div>
      </header>

      {/* ============ Compose form + Sent list (responsive grid) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
        {/* ===== Compose Form ===== */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-3 surface-1 rounded-2xl p-4 md:p-6 border border-[var(--border)]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--foreground)]">پیام جدید</h2>
          </div>

          {/* Recipient selector */}
          <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1.5">
            گیرنده
          </label>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            disabled={loadingStudents || sending}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors mb-4 disabled:opacity-60"
          >
            <option value="">همه دانش‌آموزان من</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Title input */}
          <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1.5">
            عنوان
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={sending}
            maxLength={120}
            placeholder="مثلاً: تبریک تکمیل برنامه هفتگی"
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors mb-2 disabled:opacity-60"
          />
          <div className="text-[10px] text-[var(--foreground-subtle)] mb-4 text-left">
            {toPersianDigits(title.length)} / {toPersianDigits(120)}
          </div>

          {/* Body textarea */}
          <label className="block text-[11px] font-semibold text-[var(--foreground-muted)] mb-1.5">
            متن پیام
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
            maxLength={2000}
            rows={6}
            placeholder="متن پیامت رو اینجا بنویس..."
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none mb-2 disabled:opacity-60"
          />
          <div className="text-[10px] text-[var(--foreground-subtle)] mb-4 text-left">
            {toPersianDigits(body.length)} / {toPersianDigits(2000)}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="btn-hover w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 text-sm font-semibold bg-[var(--accent)] text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                ارسال پیام
              </>
            )}
          </button>
        </motion.section>

        {/* ===== Sent Messages List ===== */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="lg:col-span-2 surface-1 rounded-2xl p-4 md:p-6 border border-[var(--border)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--foreground)]">پیام‌های ارسالی</h2>
            </div>
            {sent.length > 0 && (
              <span className="text-[10px] font-medium text-[var(--foreground-muted)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-md">
                {toPersianDigits(sent.length)}
              </span>
            )}
          </div>

          {loadingSent ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--foreground-muted)]" />
            </div>
          ) : sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                هنوز پیامی ارسال نکردی
              </p>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                پیام‌های ارسالی اینجا نمایش داده می‌شن
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[28rem] overflow-y-auto custom-scrollbar">
              {sent.map((m) => {
                const isBroadcast = m.recipientId === null;
                const recipientName = isBroadcast
                  ? null
                  : students.find((s) => s.id === m.recipientId)?.name || 'دانش‌آموز';
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-overlay)]/40 p-3 hover:border-[var(--border-strong)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[var(--foreground)] leading-snug line-clamp-1">
                        {m.title}
                      </p>
                      <span className="text-[10px] text-[var(--foreground-subtle)] shrink-0 mt-0.5">
                        {relativeTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-snug mb-2">
                      {m.body}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--foreground-subtle)]">
                      <span className="inline-flex items-center gap-1">
                        {isBroadcast ? (
                          <>
                            <Users className="w-3 h-3" />
                            همه دانش‌آموزان
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            {recipientName}
                          </>
                        )}
                      </span>
                      {!isBroadcast && (
                        <span className="inline-flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" />
                          {m.readCount > 0 ? 'خوانده‌شده' : 'خوانده‌نشده'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
