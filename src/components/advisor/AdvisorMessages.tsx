'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageSquare,
  CheckCheck,
  Check,
  Search,
  User,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileText,
  HelpCircle,
  PhoneCall,
  Clock,
  RefreshCw,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { splitPersianDateTimeFromISO } from '@/lib/persian-date';
import * as messageService from '@/lib/message-service';
import type { MessageItem, AdvisorThread, StudentAdvisorInfo } from '@/lib/message-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SUBJECT_STYLES: Record<string, { label: string; icon: typeof HelpCircle; color: string }> = {
  'سوال': { label: 'سوال', icon: HelpCircle, color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  'گزارش کار': { label: 'گزارش کار', icon: FileText, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  'درخواست تماس': { label: 'درخواست تماس', icon: PhoneCall, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
};

export default function AdvisorMessages() {
  const { user, selectedStudentId, setSelectedStudentId, navigateTo } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<AdvisorThread[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<StudentAdvisorInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(selectedStudentId || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads from API
  const loadThreads = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await messageService.getAdvisorThreads();
      setThreads(data.threads || []);
      setAssignedStudents(data.assignedStudents || []);

      // If no student is selected, preselect the first thread or the first assigned student
      if (!selectedId && data.threads?.length > 0) {
        setSelectedId(data.threads[0].student.id);
      } else if (!selectedId && data.assignedStudents?.length > 0) {
        setSelectedId(data.assignedStudents[0].id);
      }
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : 'خطا در بارگذاری پیام‌ها');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // Current selected thread
  const activeThread = threads.find((t) => t.student.id === selectedId) || null;

  // Selected student details (fallback to assignedStudents if no messages yet)
  const currentStudent =
    activeThread?.student ||
    assignedStudents.find((s) => s.id === selectedId) ||
    null;

  const currentMessages = activeThread?.messages || [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length, selectedId]);

  // Filter threads by student name or grade/major
  const filteredThreads = threads.filter((t) => {
    const fullName = `${t.student.firstName} ${t.student.lastName || ''}`.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      fullName.includes(query) ||
      (t.student.grade && t.student.grade.toLowerCase().includes(query)) ||
      (t.student.major && t.student.major.toLowerCase().includes(query))
    );
  });

  // Action: Mark a student message as read
  const handleMarkAsRead = async (messageId: string) => {
    setMarkingReadId(messageId);
    try {
      await messageService.markMessageRead(messageId);

      // Optimistic update in thread
      setThreads((prevThreads) =>
        prevThreads.map((thread) => {
          if (thread.student.id !== selectedId) return thread;

          let hadUnread = false;
          const updatedMessages = thread.messages.map((m) => {
            if (m.id === messageId && !m.isRead) {
              hadUnread = true;
              return { ...m, isRead: true };
            }
            return m;
          });

          return {
            ...thread,
            messages: updatedMessages,
            unreadCount: hadUnread ? Math.max(0, thread.unreadCount - 1) : thread.unreadCount,
          };
        }),
      );

      toast.success('پیام به عنوان خوانده‌شده ثبت شد');
    } catch {
      toast.error('خطا در ثبت وضعیت پیام');
    } finally {
      setMarkingReadId(null);
    }
  };

  // Action: Send reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) {
      toast.error('متن پاسخ را وارد کنید');
      return;
    }
    if (!selectedId) {
      toast.error('دانش‌آموزی انتخاب نشده است');
      return;
    }

    setSendingReply(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: MessageItem = {
      id: tempId,
      senderId: user?.id || 'advisor',
      receiverId: selectedId,
      subject: null,
      content: trimmed,
      isRead: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || 'advisor',
        firstName: user?.firstName || 'مشاور',
        lastName: user?.lastName || null,
        avatar: user?.avatar || '👔',
        role: 'ADVISOR',
      },
    };

    // Optimistically append to thread
    setThreads((prevThreads) => {
      const existing = prevThreads.find((t) => t.student.id === selectedId);
      if (existing) {
        return prevThreads.map((t) =>
          t.student.id === selectedId
            ? {
                ...t,
                messages: [...t.messages, optimisticMessage],
                lastMessage: optimisticMessage,
              }
            : t,
        );
      } else if (currentStudent) {
        return [
          {
            student: currentStudent,
            messages: [optimisticMessage],
            lastMessage: optimisticMessage,
            unreadCount: 0,
          },
          ...prevThreads,
        ];
      }
      return prevThreads;
    });

    setReplyText('');

    try {
      const result = await messageService.sendMessage({
        receiverId: selectedId,
        content: trimmed,
      });

      // Replace optimistic message with actual DB message
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t.student.id === selectedId
            ? {
                ...t,
                messages: t.messages.map((m) => (m.id === tempId ? result.message : m)),
                lastMessage: result.message,
              }
            : t,
        ),
      );

      toast.success('پاسخ شما با موفقیت ارسال شد');
    } catch (err) {
      // Revert optimistic message
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t.student.id === selectedId
            ? {
                ...t,
                messages: t.messages.filter((m) => m.id !== tempId),
              }
            : t,
        ),
      );
      setReplyText(trimmed);
      toast.error(err instanceof Error ? err.message : 'خطا در ارسال پاسخ');
    } finally {
      setSendingReply(false);
    }
  };

  // Action: Start editing message
  const handleStartEdit = (msg: MessageItem) => {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  };

  // Action: Cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Action: Save edited message
  const handleSaveEdit = async (messageId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed) {
      toast.error('متن پیام نمی‌تواند خالی باشد');
      return;
    }

    setSavingEdit(true);

    // Optimistic update
    setThreads((prevThreads) =>
      prevThreads.map((t) =>
        t.student.id === selectedId
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId ? { ...m, content: trimmed, isEdited: true } : m,
              ),
            }
          : t,
      ),
    );
    setEditingMessageId(null);

    try {
      const res = await messageService.editMessage(messageId, trimmed);
      setThreads((prevThreads) =>
        prevThreads.map((t) =>
          t.student.id === selectedId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId ? res.message : m,
                ),
              }
            : t,
        ),
      );
      toast.success('پیام با موفقیت ویرایش شد');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ویرایش پیام');
      void loadThreads(true);
    } finally {
      setSavingEdit(false);
    }
  };

  // Action: Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('آیا از حذف این پیام اطمینان دارید؟')) return;

    // Optimistic deletion
    setThreads((prevThreads) =>
      prevThreads.map((t) =>
        t.student.id === selectedId
          ? {
              ...t,
              messages: t.messages.filter((m) => m.id !== messageId),
            }
          : t,
      ),
    );

    try {
      await messageService.deleteMessage(messageId);
      toast.success('پیام با موفقیت حذف شد');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف پیام');
      void loadThreads(true);
    }
  };

  const renderSubjectBadge = (subj: string | null) => {
    if (!subj) return null;
    const style = SUBJECT_STYLES[subj] || {
      label: subj,
      icon: HelpCircle,
      color: 'text-zinc-400 border-zinc-700 bg-zinc-800',
    };
    const Icon = style.icon;

    return (
      <Badge
        variant="outline"
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md border ${style.color}`}
      >
        <Icon className="w-3 h-3" />
        <span>{subj}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4" dir="rtl">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-sm text-[var(--foreground-muted)]">در حال بارگذاری گفتگوهای دانش‌آموزان...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>صندوق پیام‌ها و گفتگو با دانش‌آموزان</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            مشاهده سوالات، بررسی گزارش کارها، تایید خوانده‌شده و ارسال پاسخ
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadThreads(false)}
          className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 ml-1.5" />
          به‌روزرسانی گفتگوها
        </Button>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* Left Column: Students Threads List (4 cols) */}
        <Card className="lg:col-span-4 border-zinc-800 bg-zinc-950/70 shadow-lg flex flex-col h-full">
          <CardHeader className="p-4 border-b border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-zinc-200">گفتگوها</CardTitle>
              <Badge variant="outline" className="text-xs border-zinc-800 text-zinc-400">
                {threads.length} دانش‌آموز
              </Badge>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا رشته دانش‌آموز..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pr-9 pl-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </CardHeader>

          <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5 max-h-[560px]">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 px-4 text-zinc-500 text-xs">
                {searchQuery ? 'دانش‌آموزی با این مشخصات یافت نشد' : 'هنوز پیامی از سمت دانش‌آموزان ثبت نشده است'}
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = t.student.id === selectedId;
                const studentName = `${t.student.firstName} ${t.student.lastName || ''}`.trim();
                const lastMsg = t.lastMessage;
                const lastMsgTime = lastMsg ? splitPersianDateTimeFromISO(lastMsg.createdAt) : null;

                return (
                  <button
                    key={t.student.id}
                    onClick={() => setSelectedId(t.student.id)}
                    className={`w-full text-right p-3 rounded-xl transition-all border flex items-start gap-3 ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500/40 shadow-sm'
                        : 'border-transparent hover:bg-zinc-900/50 hover:border-zinc-800/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-lg shadow-inner">
                        {t.student.avatar || <User className="w-5 h-5 text-zinc-400" />}
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-black flex items-center justify-center px-1 shadow-md">
                          {t.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-zinc-100 truncate">
                          {studentName}
                        </span>
                        {lastMsgTime && (
                          <span className="text-[10px] text-zinc-500 font-sans shrink-0">
                            {lastMsgTime.datePart}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
                        <span>{t.student.grade || 'پایه نامشخص'}</span>
                        <span>·</span>
                        <span>{t.student.major || 'رشته نامشخص'}</span>
                      </div>

                      {/* Last message preview */}
                      {lastMsg ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                          {lastMsg.subject && (
                            <span className="shrink-0 text-emerald-400 font-semibold">
                              [{lastMsg.subject}]
                            </span>
                          )}
                          <span className="truncate">{lastMsg.content}</span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">بدون پیام</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Active Thread Messages + Reply Form (8 cols) */}
        <Card className="lg:col-span-8 border-zinc-800 bg-zinc-950/70 shadow-lg flex flex-col h-full">
          {!currentStudent ? (
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-4">
              <MessageSquare className="w-12 h-12 text-zinc-600 mb-3" />
              <p className="text-sm font-semibold text-zinc-300">گفتگویی انتخاب نشده است</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                لطفاً از ستون کناری، یک دانش‌آموز را انتخاب کنید تا تاریخچه پیام‌ها نمایش داده شود.
              </p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xl shadow-inner">
                    {currentStudent.avatar || <User className="w-5 h-5 text-zinc-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-100">
                        {`${currentStudent.firstName} ${currentStudent.lastName || ''}`.trim()}
                      </h2>
                      {activeThread && activeThread.unreadCount > 0 && (
                        <Badge className="bg-emerald-500 text-zinc-950 text-[10px] font-bold">
                          {activeThread.unreadCount} پیام جدید
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {currentStudent.grade || 'پایه نامشخص'} · {currentStudent.major || 'رشته نامشخص'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudentId(currentStudent.id);
                      navigateTo({ view: 'advisor-student-detail' });
                    }}
                    className="h-8 px-3 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-xs inline-flex items-center gap-1.5"
                  >
                    <span>مشاهده پرونده دانش‌آموز</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] min-h-[350px]">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500 text-xs">
                    هنوز پیامی بین شما و این دانش‌آموز رد و بدل نشده است. می‌توانید اولین پیام را از فرم زیر ارسال نمایید.
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {currentMessages.map((msg) => {
                      const isFromStudent = msg.senderId === currentStudent.id;
                      const isFromAdvisor = !isFromStudent;
                      const { datePart, timePart } = splitPersianDateTimeFromISO(msg.createdAt);
                      const isEditingThis = editingMessageId === msg.id;

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex flex-col ${isFromStudent ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 transition-all shadow-sm ${
                              isFromStudent
                                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm'
                                : 'bg-emerald-950/20 border border-emerald-500/25 text-zinc-100 rounded-br-sm'
                            }`}
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    isFromStudent ? 'text-sky-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {isFromStudent
                                    ? `${currentStudent.firstName} (دانش‌آموز)`
                                    : 'شما (مشاور)'}
                                </span>
                                {isFromStudent && renderSubjectBadge(msg.subject)}
                              </div>

                              {/* Structured RTL-Safe Timestamp + Action Menu */}
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

                                {/* Dropdown Menu for Advisor's message (Edit / Delete) */}
                                {isFromAdvisor && !isEditingThis && (
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

                            {/* Message Body OR Inline Edit Form */}
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

                            {/* Message Footer: Action for Student message OR Read status */}
                            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-zinc-800/60">
                              {isFromStudent ? (
                                <>
                                  {/* Read receipt / Mark as Read button */}
                                  {msg.isRead ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                                      <span>خوانده‌شده</span>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={markingReadId === msg.id}
                                      onClick={() => handleMarkAsRead(msg.id)}
                                      className="h-7 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-lg text-xs inline-flex items-center gap-1.5"
                                      title="تایید و ثبت به عنوان خوانده‌شده"
                                    >
                                      {markingReadId === msg.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>تایید و خواندم</span>
                                    </Button>
                                  )}

                                  {msg.subject === 'گزارش کار' && (
                                    <span className="text-[10px] text-zinc-400">
                                      گزارش کار دانش‌آموز
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-end w-full gap-1.5 text-[11px]">
                                  {msg.isRead ? (
                                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                      <CheckCheck className="w-3.5 h-3.5" />
                                      <span>خوانده‌شده توسط دانش‌آموز</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-zinc-500">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>ارسال شده</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
                <form onSubmit={handleSendReply} className="space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ یا راهنمایی خود را بنویسید..."
                    rows={3}
                    className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-sm focus-visible:border-emerald-500/50 resize-y min-h-[80px]"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-zinc-500">
                      پیام بلافاصله در صندوق پیام دانش‌آموز ثبت و نمایش داده می‌شود.
                    </p>
                    <Button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-5 h-9 rounded-xl shadow-md shadow-emerald-500/10 inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>در حال ارسال...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 rotate-180 ml-1" />
                          <span>ارسال پاسخ</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
