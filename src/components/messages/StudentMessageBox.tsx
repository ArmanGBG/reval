'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCheck,
  Check,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  FileText,
  PhoneCall,
  Sparkles,
  Loader2,
  RefreshCw,
  UserCheck,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { splitPersianDateTimeFromISO } from '@/lib/persian-date';
import * as messageService from '@/lib/message-service';
import type { MessageItem, StudentAdvisorInfo } from '@/lib/message-service';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SubjectOption = 'سوال' | 'گزارش کار' | 'درخواست تماس';

const SUBJECT_OPTIONS: { value: SubjectOption; label: string; icon: typeof HelpCircle; color: string }[] = [
  { value: 'سوال', label: 'سوال', icon: HelpCircle, color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  { value: 'گزارش کار', label: 'گزارش کار', icon: FileText, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'درخواست تماس', label: 'درخواست تماس', icon: PhoneCall, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
];

export function StudentMessageBox() {
  const { user, navigateTo } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [advisor, setAdvisor] = useState<StudentAdvisorInfo | null>(null);
  const [hasAdvisor, setHasAdvisor] = useState<boolean>(Boolean(user?.assignedAdvisorId));

  // Form state
  const [subject, setSubject] = useState<SubjectOption>('سوال');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch thread
  const loadThread = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await messageService.getStudentThread();
      setMessages(data.messages || []);
      setAdvisor(data.advisor);
      setHasAdvisor(data.hasAdvisor);

      // Auto mark unread advisor messages as read
      if (data.messages && user?.id) {
        const unreadFromAdvisor = data.messages.filter(
          (m) => m.receiverId === user.id && !m.isRead,
        );
        for (const msg of unreadFromAdvisor) {
          void messageService.markMessageRead(msg.id);
        }
      }
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری پیام‌ها');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error('لطفاً متن پیام را وارد کنید');
      return;
    }

    if (!advisor?.id && !user?.assignedAdvisorId) {
      toast.error('شما مشاور فعالی ندارید');
      return;
    }

    const advisorId = advisor?.id || user?.assignedAdvisorId;
    if (!advisorId) return;

    setSending(true);

    // Optimistic message item
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: MessageItem = {
      id: tempId,
      senderId: user?.id || 'me',
      receiverId: advisorId,
      subject,
      content: trimmed,
      isRead: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'me',
        firstName: user?.firstName || 'دانش‌آموز',
        lastName: user?.lastName || null,
        avatar: user?.avatar || '🎓',
        role: 'STUDENT',
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setContent('');

    try {
      const result = await messageService.sendMessage({
        receiverId: advisorId,
        subject,
        content: trimmed,
      });

      // Replace optimistic message with server message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? result.message : m)),
      );
      toast.success('پیام شما با موفقیت به مشاور ارسال شد');
    } catch (err) {
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setContent(trimmed);
      toast.error(err instanceof Error ? err.message : 'خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  // Start editing a message
  const handleStartEdit = (msg: MessageItem) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Save edited message
  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed) {
      toast.error('متن پیام نمی‌تواند خالی باشد');
      return;
    }

    setSavingEdit(true);
    const original = messages.find((m) => m.id === messageId);

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: trimmed, isEdited: true } : m,
      ),
    );
    setEditingMessageId(null);

    try {
      const res = await messageService.editMessage(messageId, trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? res.message : m)),
      );
      toast.success('پیام با موفقیت ویرایش شد');
    } catch (err) {
      if (original) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? original : m)),
        );
      }
      toast.error(err instanceof Error ? err.message : 'خطا در ویرایش پیام');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('آیا از حذف این پیام اطمینان دارید؟')) return;

    const backup = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      await messageService.deleteMessage(messageId);
      toast.success('پیام با موفقیت حذف شد');
    } catch (err) {
      setMessages(backup);
      toast.error(err instanceof Error ? err.message : 'خطا در حذف پیام');
    }
  };

  // Render badge for message subject
  const renderSubjectBadge = (subj: string | null) => {
    if (!subj) return null;
    const option = SUBJECT_OPTIONS.find((o) => o.value === subj);
    const colorClass = option ? option.color : 'text-zinc-400 border-zinc-700 bg-zinc-800';
    const Icon = option?.icon || HelpCircle;

    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border ${colorClass}`}
      >
        <Icon className="w-3 h-3" />
        <span>{subj}</span>
      </Badge>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4" dir="rtl">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">در حال بارگذاری صندوق پیام‌ها...</p>
      </div>
    );
  }

  // 1. EMPTY STATE: Student has no assigned advisor
  if (!hasAdvisor && !user?.assignedAdvisorId) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4" dir="rtl">
        <Card className="border border-zinc-800/80 bg-zinc-950/80 shadow-2xl backdrop-blur-xl overflow-hidden text-center relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardHeader className="pt-8 pb-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-inner">
              <GraduationCap className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-zinc-100">
              صندوق پیام و ارتباط با مشاور
            </CardTitle>
            <CardDescription className="text-sm text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
              شما در حال حاضر مشاور تحصیلی فعالی ندارید. برای ارسال پیام، دریافت گزارش کار و راهنمایی‌های اختصاصی، ابتدا یک مشاور انتخاب کنید.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2 pb-6 px-6 max-w-lg mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>بررسی گزارش کار</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">ارسال گزارش‌های مطالعه و بازخورد روزانه</p>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>پاسخ به سوالات</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">رفع ابهامات درسی و هدایت تحصیلی</p>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>درخواست تماس</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">هماهنگی جلسات مشاوره تلفنی و آنلاین</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pb-8 pt-0 flex justify-center">
            <Button
              onClick={() => navigateTo({ view: 'settings' })}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
            >
              <span>رفتن به پروفایل و تنظیمات</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. ACTIVE STATE: Has advisor, show history + message form
  const advisorName = advisor ? `${advisor.firstName} ${advisor.lastName || ''}`.trim() : 'مشاور تحصیلی';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" dir="rtl">
      {/* Advisor Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl overflow-hidden shadow-inner">
            {advisor?.avatar ? <span>{advisor.avatar}</span> : <UserCheck className="w-6 h-6 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-100">{advisorName}</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                مشاور اختصاصی شما
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              صندوق مکاتبات، ارسال سوالات، گزارش کار و درخواست‌های تماس
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadThread(false)}
          className="h-9 px-3 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Message History */}
      <Card className="border border-zinc-800 bg-zinc-950/60 shadow-lg">
        <CardHeader className="border-b border-zinc-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <CardTitle className="text-base font-bold text-zinc-100">تاریخچه پیام‌ها</CardTitle>
            </div>
            <span className="text-xs text-zinc-500">
              {messages.length > 0 ? `${messages.length} پیام ثبت شده` : 'بدون پیام'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">هنوز پیامی رد و بدل نشده است</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                می‌توانید اولین پیام خود (سوال، گزارش کار یا درخواست تماس) را از فرم زیر برای مشاور ارسال نمایید.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 pr-2">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isSentByMe = msg.senderId === user?.id;
                  const { datePart, timePart } = splitPersianDateTimeFromISO(msg.createdAt);
                  const isEditingThis = editingMessageId === msg.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all shadow-sm ${
                          isSentByMe
                            ? 'bg-zinc-900 border border-emerald-500/20 text-zinc-100 rounded-br-sm'
                            : 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-bl-sm'
                        }`}
                      >
                        {/* Header: Sender tag, Subject badge & Structured Timestamp */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isSentByMe ? 'text-emerald-400' : 'text-sky-400'
                              }`}
                            >
                              {isSentByMe ? 'شما' : advisorName}
                            </span>
                            {renderSubjectBadge(msg.subject)}
                          </div>

                          {/* Fix RTL Timestamp Issue: Separate Date and Time + Edit/Delete Dropdown */}
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 shrink-0">
                            {msg.isEdited && (
                              <span className="text-[10px] text-zinc-500 font-medium ml-0.5">
                                (ویرایش شده)
                              </span>
                            )}
                            <span className="font-sans">{datePart}</span>
                            <span className="text-zinc-600 font-bold">•</span>
                            <span dir="ltr" className="font-mono text-zinc-400">
                              {timePart}
                            </span>

                            {/* Dropdown Menu for Sender's message (Edit / Delete) */}
                            {isSentByMe && !isEditingThis && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1 -ml-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
                                    title="گزینه‌ها"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-zinc-900 border-zinc-800 text-zinc-200 min-w-[120px]"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleStartEdit(msg)}
                                    className="cursor-pointer gap-2 text-xs focus:bg-zinc-800"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-sky-400" />
                                    <span>ویرایش</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="cursor-pointer gap-2 text-xs text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>

                        {/* Content OR Inline Edit Form */}
                        {isEditingThis ? (
                          <div className="space-y-2 mt-1">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={3}
                              className="w-full bg-zinc-950 border-zinc-700 text-zinc-100 text-sm rounded-lg p-2.5 focus-visible:border-emerald-500/50 resize-y min-h-[70px]"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={savingEdit}
                                onClick={handleCancelEdit}
                                className="h-7 px-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg inline-flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>لغو</span>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={savingEdit || !editingContent.trim()}
                                onClick={() => handleSaveEdit(msg.id)}
                                className="h-7 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg shadow-sm inline-flex items-center gap-1"
                              >
                                {savingEdit ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>ذخیره</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">
                            {msg.content}
                          </p>
                        )}

                        {/* Footer: Read Receipt for sent messages */}
                        {isSentByMe && (
                          <div className="flex items-center justify-end gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60">
                            {msg.isRead ? (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>دیده‌شده توسط مشاور</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                                <Check className="w-3.5 h-3.5 text-zinc-500" />
                                <span>ارسال شده</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Compose Form */}
      <Card className="border border-zinc-800 bg-zinc-950/60 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ارسال پیام جدید به مشاور</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            موضوع پیام را مشخص کرده و توضیحات یا سوال خود را بنویسید.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSendMessage}>
          <CardContent className="space-y-4 pt-1">
            {/* Title / Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">موضوع پیام</label>
              <Select value={subject} onValueChange={(val) => setSubject(val as SubjectOption)}>
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 text-sm h-11 focus:border-emerald-500/50">
                  <SelectValue placeholder="موضوع پیام را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  {SUBJECT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800">
                        <div className="flex items-center gap-2 py-0.5">
                          <Icon className="w-4 h-4 text-emerald-400" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">متن پیام</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن پیام، جزئیات سوال یا خلاصه گزارش کار خود را اینجا بنویسید..."
                rows={5}
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:border-emerald-500/50 resize-y min-h-[120px]"
              />
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-5 flex items-center justify-between">
            <p className="text-[11px] text-zinc-500">
              مشاور پس از مشاهده پیام، وضعیت خوانده‌شده را ثبت کرده و پاسخ خواهد داد.
            </p>
            <Button
              type="submit"
              disabled={sending || !content.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-6 h-11 rounded-xl shadow-md shadow-emerald-500/10 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ارسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-1 rotate-180" />
                  <span>ارسال پیام</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default StudentMessageBox;
