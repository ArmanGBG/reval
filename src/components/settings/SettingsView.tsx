'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, LogOut, HelpCircle, MessageSquarePlus, ChevronLeft,
  User, Target, Settings as SettingsIcon, LifeBuoy, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { Grade, Major, Goal, Ticket } from '@/lib/types';
import { AVATARS } from '@/lib/constants/mockData';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const GRADES: Grade[] = ['دهم', 'یازدهم', 'دوازدهم', 'پشت کنکوری'];
const MAJORS: Major[] = ['تجربی', 'ریاضی', 'انسانی', 'معارف'];
const GOALS: Goal[] = ['کنکور', 'نهایی', 'هر دو'];
const TICKET_TOPICS = ['مشکل فنی', 'پیشنهاد', 'سوال', 'شکایت'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: 'باز', color: 'bg-[rgba(245,181,68,0.12)] text-[var(--warning)]' },
  answered: { label: 'پاسخ داده شده', color: 'bg-[var(--accent-soft)] text-[var(--accent)]' },
  closed: { label: 'بسته شده', color: 'bg-[rgba(255,255,255,0.06)] text-[var(--foreground-muted)]' },
};

// ===== Section config for desktop nav =====
type SectionId = 'profile' | 'goals' | 'experience' | 'support' | 'about';
const SECTIONS: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'پروفایل و هویت', icon: User },
  { id: 'goals', label: 'اهداف', icon: Target },
  { id: 'experience', label: 'تنظیمات اپلیکیشن', icon: SettingsIcon },
  { id: 'support', label: 'پشتیبانی', icon: LifeBuoy },
  { id: 'about', label: 'درباره اپ', icon: Info },
];

// ===== Selectable Pill =====
function SelectPill<T extends string>({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: T;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-hover px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] border ${
        active
          ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)] shadow-[0_4px_12px_-2px_var(--accent-glow)]'
          : 'surface-1 text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]'
      }`}
    >
      {children}
    </button>
  );
}

// ===== Section Card =====
function SectionCard({
  id, title, icon: Icon, children,
}: {
  id?: string;
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-4 md:p-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

// ===== Profile Section =====
function ProfileSection({
  displayName, setDisplayName,
  selectedAvatar, setSelectedAvatar,
  selectedGrade, setSelectedGrade,
  selectedMajor, setSelectedMajor,
  showAvatarGrid, setShowAvatarGrid,
  onSave,
}: {
  displayName: string;
  setDisplayName: (v: string) => void;
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;
  selectedGrade: Grade;
  setSelectedGrade: (v: Grade) => void;
  selectedMajor: Major;
  setSelectedMajor: (v: Major) => void;
  showAvatarGrid: boolean;
  setShowAvatarGrid: (v: boolean) => void;
  onSave: () => void;
}) {
  return (
    <SectionCard id="profile" title="پروفایل و هویت" icon={User}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-4xl border-2 border-[var(--border-strong)]">
            {selectedAvatar}
          </div>
          <button
            onClick={() => setShowAvatarGrid(!showAvatarGrid)}
            className="btn-hover glow-hover absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg"
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--bg-deep)]" />
          </button>
        </div>

        <AnimatePresence>
          {showAvatarGrid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-6 gap-2 w-full"
            >
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarGrid(false);
                  }}
                  className={`btn-hover w-12 h-12 rounded-[var(--radius)] flex items-center justify-center text-2xl transition-all min-h-[44px] border ${
                    selectedAvatar === avatar
                      ? 'bg-[var(--accent-soft)] border-2 border-[var(--accent)]'
                      : 'surface-1 border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground-muted)] text-sm">چی صدات کنیم؟</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
          placeholder="نام نمایشی"
        />
      </div>

      {/* Grade Selector */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground-muted)] text-sm">پایه</Label>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((grade) => (
            <SelectPill key={grade} active={selectedGrade === grade} onClick={() => setSelectedGrade(grade)}>
              {grade}
            </SelectPill>
          ))}
        </div>
      </div>

      {/* Major Selector */}
      <div className="space-y-2">
        <Label className="text-[var(--foreground-muted)] text-sm">رشته</Label>
        <div className="flex flex-wrap gap-2">
          {MAJORS.map((major) => (
            <SelectPill key={major} active={selectedMajor === major} onClick={() => setSelectedMajor(major)}>
              {major}
            </SelectPill>
          ))}
        </div>
      </div>

      <button
        onClick={onSave}
        className="btn-hover glow-hover w-full bg-[var(--accent)] text-[var(--bg-deep)] font-bold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[var(--accent-hover)]"
      >
        ذخیره تغییرات
      </button>
    </SectionCard>
  );
}

// ===== Goals Section =====
function GoalsSection({
  dailyTarget, setDailyTarget,
  selectedGoal, setSelectedGoal,
  onSave,
}: {
  dailyTarget: number;
  setDailyTarget: (v: number) => void;
  selectedGoal: Goal;
  setSelectedGoal: (v: Goal) => void;
  onSave: () => void;
}) {
  const toPersianNum = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  return (
    <SectionCard id="goals" title="اهداف" icon={Target}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-[var(--foreground-muted)] text-sm">هدف مطالعه روزانه</Label>
          <span className="text-[var(--accent)] font-bold text-lg tabular-nums">{toPersianNum(dailyTarget)} ساعت</span>
        </div>
        <Slider
          value={[dailyTarget]}
          onValueChange={(val) => setDailyTarget(val[0])}
          min={4}
          max={12}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-[var(--foreground-muted)]">
          <span>۴ ساعت</span>
          <span>۱۲ ساعت</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--foreground-muted)] text-sm">هدف اصلی</Label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((goal) => (
            <SelectPill key={goal} active={selectedGoal === goal} onClick={() => setSelectedGoal(goal)}>
              {goal}
            </SelectPill>
          ))}
        </div>
      </div>

      <button
        onClick={onSave}
        className="btn-hover glow-hover w-full bg-[var(--accent)] text-[var(--bg-deep)] font-bold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[var(--accent-hover)]"
      >
        ذخیره
      </button>
    </SectionCard>
  );
}

// ===== App Experience Section =====
function ExperienceSection({
  hapticFeedback, setHapticFeedback,
  notificationReminders, setNotificationReminders,
}: {
  hapticFeedback: boolean;
  setHapticFeedback: (v: boolean) => void;
  notificationReminders: boolean;
  setNotificationReminders: (v: boolean) => void;
}) {
  return (
    <SectionCard id="experience" title="تنظیمات اپلیکیشن" icon={SettingsIcon}>
      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <p className="text-[var(--foreground)] text-sm font-medium">بازخورد لرزشی</p>
          <p className="text-[var(--foreground-muted)] text-xs mt-0.5">لرزش هنگام تعامل</p>
        </div>
        <Switch checked={hapticFeedback} onCheckedChange={setHapticFeedback} />
      </div>

      <div className="h-px bg-[var(--border)]" />

      <div className="flex items-center justify-between min-h-[44px]">
        <div>
          <p className="text-[var(--foreground)] text-sm font-medium">یادآوری اعلان‌ها</p>
          <p className="text-[var(--foreground-muted)] text-xs mt-0.5">اعلان برای برنامه مطالعه</p>
        </div>
        <Switch checked={notificationReminders} onCheckedChange={setNotificationReminders} />
      </div>
    </SectionCard>
  );
}

// ===== Support Section =====
function SupportSection({
  tickets, onNewTicket, onFAQ, onLogout,
}: {
  tickets: Ticket[];
  onNewTicket: () => void;
  onFAQ: () => void;
  onLogout: () => void;
}) {
  return (
    <SectionCard id="support" title="پشتیبانی" icon={LifeBuoy}>
      <button
        onClick={onNewTicket}
        className="btn-hover w-full flex items-center justify-center gap-2 border-2 border-[var(--accent)] text-[var(--accent)] font-semibold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[var(--accent-soft)]"
      >
        <MessageSquarePlus className="w-5 h-5" />
        ایجاد تیکت جدید
      </button>

      {tickets.length > 0 && (
        <Accordion type="multiple" className="w-full">
          {tickets.map((ticket) => (
            <AccordionItem
              key={ticket.id}
              value={ticket.id}
              className="border-[var(--border)]"
            >
              <AccordionTrigger className="text-[var(--foreground)] hover:no-underline py-3">
                <div className="flex items-center gap-2 flex-1 text-right">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">{ticket.subject}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{ticket.topic}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      STATUS_CONFIG[ticket.status]?.color || ''
                    }`}
                  >
                    {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-[var(--foreground-muted)] text-sm">
                <p className="mb-2">{ticket.message}</p>
                <p className="text-xs text-[var(--foreground-subtle)]">{ticket.createdAt}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <button
        onClick={onFAQ}
        className="btn-hover nav-item-hover w-full flex items-center justify-center gap-2 text-[var(--foreground-muted)] text-sm py-3 rounded-[var(--radius)] min-h-[44px] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.03)]"
      >
        <HelpCircle className="w-4 h-4" />
        سوالات متداول
      </button>

      <button
        onClick={onLogout}
        className="btn-hover w-full flex items-center justify-center gap-2 border-2 border-[#EF4444] text-[#F87171] font-semibold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[rgba(239,68,68,0.08)]"
      >
        <LogOut className="w-5 h-5" />
        خروج از حساب
      </button>
    </SectionCard>
  );
}

// ===== About Section =====
function AboutSection() {
  return (
    <section id="about" className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] flex items-center justify-center">
          <Info className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <h2 className="text-base font-bold text-[var(--foreground)]">درباره اپ</h2>
      </div>
      <div className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-5 text-center space-y-1">
        <p className="text-[var(--foreground)] text-sm font-bold">روال نسخه ۱.۰.۰</p>
        <p className="text-[var(--foreground-muted)] text-xs">ساخته شده برای دانش‌آموزان ایران</p>
      </div>
    </section>
  );
}

// ===== Ticket Drawer =====
function TicketDrawer({
  open, onOpenChange,
  ticketTopic, setTicketTopic,
  ticketSubject, setTicketSubject,
  ticketMessage, setTicketMessage,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketTopic: string;
  setTicketTopic: (v: string) => void;
  ticketSubject: string;
  setTicketSubject: (v: string) => void;
  ticketMessage: string;
  setTicketMessage: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="surface-2 border-t border-[var(--border-strong)]" dir="rtl">
        <DrawerHeader>
          <DrawerTitle className="text-[var(--foreground)] text-right">ایجاد تیکت جدید</DrawerTitle>
          <DrawerDescription className="text-[var(--foreground-muted)] text-right">
            مشکل یا پیشنهاد خود را با ما در میان بگذارید
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--foreground-muted)] text-sm">موضوع</Label>
            <div className="flex flex-wrap gap-2">
              {TICKET_TOPICS.map((topic) => (
                <SelectPill key={topic} active={ticketTopic === topic} onClick={() => setTicketTopic(topic)}>
                  {topic}
                </SelectPill>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--foreground-muted)] text-sm">عنوان</Label>
            <Input
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]"
              placeholder="عنوان تیکت"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--foreground-muted)] text-sm">پیام</Label>
            <Textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] min-h-[100px]"
              placeholder="پیام خود را بنویسید..."
            />
          </div>
        </div>

        <DrawerFooter>
          <button
            onClick={onSubmit}
            className="btn-hover glow-hover w-full bg-[var(--accent)] text-[var(--bg-deep)] font-semibold py-3 rounded-[var(--radius)] min-h-[44px] hover:bg-[var(--accent-hover)]"
          >
            ارسال تیکت
          </button>
          <DrawerClose asChild>
            <button
              className="btn-hover nav-item-hover w-full surface-1 text-[var(--foreground-muted)] font-medium py-3 rounded-[var(--radius)] min-h-[44px] hover:text-[var(--foreground)] border border-[var(--border)]"
            >
              انصراف
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ===== Main Component =====
export default function SettingsView() {
  const {
    user,
    updateUser,
    hapticFeedback,
    notificationReminders,
    setHapticFeedback,
    setNotificationReminders,
    tickets,
    addTicket,
  } = useAppStore();

  // Local state for profile editing
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🦊');
  const [selectedGrade, setSelectedGrade] = useState<Grade>(user?.grade || 'یازدهم');
  const [selectedMajor, setSelectedMajor] = useState<Major>(user?.major || 'تجربی');
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);

  // Goals state
  const [dailyTarget, setDailyTarget] = useState(user?.dailyTargetHours || 6);
  const [selectedGoal, setSelectedGoal] = useState<Goal>(user?.goal || 'کنکور');

  // Ticket drawer state
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [ticketTopic, setTicketTopic] = useState<string>('مشکل فنی');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Desktop: active section
  const [activeSection, setActiveSection] = useState<SectionId>('profile');

  const handleSaveProfile = () => {
    updateUser({
      name: displayName,
      avatar: selectedAvatar,
      grade: selectedGrade,
      major: selectedMajor,
    });
    toast.success('تغییرات ذخیره شد');
  };

  const handleSaveGoals = () => {
    updateUser({
      dailyTargetHours: dailyTarget,
      goal: selectedGoal,
    });
    toast.success('اهداف ذخیره شد');
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('لطفاً همه فیلدها را پر کنید');
      return;
    }
    const newTicket: Ticket = {
      id: Date.now().toString(),
      topic: ticketTopic,
      subject: ticketSubject,
      message: ticketMessage,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
    };
    addTicket(newTicket);
    setTicketSubject('');
    setTicketMessage('');
    setTicketDrawerOpen(false);
    toast.success('تیکت شما ثبت شد');
  };

  const handleLogout = () => {
    toast('به زودی!');
  };

  const handleFAQ = () => {
    toast('سوالات متداول به زودی اضافه می‌شود');
  };

  // Shared props for sections
  const profileProps = {
    displayName, setDisplayName,
    selectedAvatar, setSelectedAvatar,
    selectedGrade, setSelectedGrade,
    selectedMajor, setSelectedMajor,
    showAvatarGrid, setShowAvatarGrid,
    onSave: handleSaveProfile,
  };
  const goalsProps = {
    dailyTarget, setDailyTarget,
    selectedGoal, setSelectedGoal,
    onSave: handleSaveGoals,
  };
  const experienceProps = {
    hapticFeedback, setHapticFeedback,
    notificationReminders, setNotificationReminders,
  };
  const supportProps = {
    tickets,
    onNewTicket: () => setTicketDrawerOpen(true),
    onFAQ: handleFAQ,
    onLogout: handleLogout,
  };
  const ticketDrawerProps = {
    open: ticketDrawerOpen,
    onOpenChange: setTicketDrawerOpen,
    ticketTopic, setTicketTopic,
    ticketSubject, setTicketSubject,
    ticketMessage, setTicketMessage,
    onSubmit: handleSubmitTicket,
  };

  return (
    <div dir="rtl">
      {/* ===================================================
          MOBILE LAYOUT (grouped list, single column)
          =================================================== */}
      <div className="md:hidden max-w-md mx-auto px-4 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <SettingsIcon className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--foreground)]">تنظیمات</h1>
        </motion.div>

        <div className="space-y-6">
          <ProfileSection {...profileProps} />
          <GoalsSection {...goalsProps} />
          <ExperienceSection {...experienceProps} />
          <SupportSection {...supportProps} />
          <AboutSection />
        </div>

        <TicketDrawer {...ticketDrawerProps} />
      </div>

      {/* ===================================================
          DESKTOP LAYOUT (2-col: nav + content panel)
          =================================================== */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="flex items-end justify-between mb-8 pb-6 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)] font-semibold">
              <span>تنظیمات</span>
              <ChevronLeft className="w-3 h-3 flip-rtl" />
              <span className="text-[var(--accent)]">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">تنظیمات</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ===== Nav Sidebar (right in RTL = first child) ===== */}
          <aside className="lg:col-span-1">
            <nav className="surface-1 edge-highlight rounded-[var(--radius-lg)] p-2 sticky top-6">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`nav-item-hover w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-right">{section.label}</span>
                    {isActive && (
                      <ChevronLeft className="w-3.5 h-3.5 flip-rtl shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ===== Content Panel (col-span-3) ===== */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'profile' && <ProfileSection {...profileProps} />}
                {activeSection === 'goals' && <GoalsSection {...goalsProps} />}
                {activeSection === 'experience' && <ExperienceSection {...experienceProps} />}
                {activeSection === 'support' && <SupportSection {...supportProps} />}
                {activeSection === 'about' && <AboutSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <TicketDrawer {...ticketDrawerProps} />
      </div>
    </div>
  );
}
