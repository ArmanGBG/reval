'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Phone, User as UserIcon, GraduationCap, Loader2, Shield, Building2, BookOpen } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAppStore } from '@/lib/store';
import { AVATARS } from '@/lib/constants/mockData';
import type { Grade, Major, User, UserRole } from '@/lib/types';

// ===== Constants =====
const GRADES: Grade[] = ['دهم', 'یازدهم', 'دوازدهم', 'پشت کنکوری'];
const GRADE_LABELS: Record<Grade, string> = {
  'دهم': 'پایه دهم',
  'یازدهم': 'پایه یازدهم',
  'دوازدهم': 'پایه دوازدهم',
  'پشت کنکوری': 'پشت کنکوری',
};
// Only three majors — معارف removed per product decision.
const MAJORS: Major[] = ['تجربی', 'ریاضی', 'انسانی'];

// Self-registerable roles. SUPER_ADMIN is seed-only and excluded here.
type RegisterRole = Extract<UserRole, 'STUDENT' | 'ADVISOR' | 'INSTITUTE_MANAGER'>;
const ROLE_OPTIONS: { value: RegisterRole; label: string; desc: string; icon: typeof GraduationCap }[] = [
  { value: 'STUDENT', label: 'دانش‌آموز', desc: 'برنامه مطالعه، تسک و تحلیل پیشرفت', icon: GraduationCap },
  { value: 'ADVISOR', label: 'مشاور', desc: 'مدیریت دانش‌آموزان و ارسال پیام', icon: Shield },
  { value: 'INSTITUTE_MANAGER', label: 'مدیر آموزشگاه', desc: 'مدیریت مشاوران و دانش‌آموزان آموزشگاه', icon: Building2 },
];

// ===== Animation Variants =====
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
};

// ===== Progress Indicator =====
// Renders `totalSteps` dots. The total depends on the selected role:
//  - STUDENT:           4 steps (phone → role → identity → academic)
//  - INSTITUTE_MANAGER: 4 steps (phone → role → identity → institute)
//  - ADVISOR:           3 steps (phone → role → identity)
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`
            h-2 rounded-full transition-all duration-300
            ${step < currentStep ? 'w-8 bg-mint' : ''}
            ${step === currentStep ? 'w-8 bg-mint animate-pulse' : ''}
            ${step > currentStep ? 'w-8 bg-[var(--bg-overlay)] border border-[var(--border)]' : ''}
          `}
        />
      ))}
    </div>
  );
}

// ===== Step 1: Phone Authentication =====
function StepPhone({
  phone,
  setPhone,
  showOtp,
  setShowOtp,
  otp,
  setOtp,
  onSendCode,
  direction,
}: {
  phone: string;
  setPhone: (v: string) => void;
  showOtp: boolean;
  setShowOtp: (v: boolean) => void;
  otp: string;
  setOtp: (v: string) => void;
  onSendCode: () => void;
  direction: number;
}) {
  const isValidPhone = /^9\d{9}$/.test(phone);

  return (
    <motion.div
      key="step1"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <Phone className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">ورود به روال</h1>
      <p className="text-muted-foreground mb-8">شماره موبایلت رو وارد کن</p>

      {!showOtp ? (
        <div className="w-full space-y-6">
          <div className="flex gap-2" dir="ltr">
            <div className="flex items-center justify-center bg-[var(--bg-overlay)] border border-[var(--border-strong)] rounded-lg px-3 h-12 text-muted-foreground text-sm shrink-0 min-w-[64px]">
              +98
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) setPhone(val);
              }}
              placeholder="9123456789"
              className="flex-1 h-12 bg-[var(--bg-overlay)] border border-[var(--border-strong)] rounded-lg px-4 text-foreground text-left placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/50 transition-all"
              maxLength={10}
            />
          </div>

          <motion.button
            onClick={onSendCode}
            disabled={!isValidPhone}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="w-full h-12 bg-mint hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--bg-deep)] font-bold rounded-lg transition-all duration-200"
          >
            ارسال کد تایید
          </motion.button>
        </div>
      ) : (
        <div className="w-full space-y-6">
          <p className="text-muted-foreground text-sm text-center">کد تایید ۴ رقمی ارسال شده رو وارد کن</p>

          <div dir="ltr" className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot
                  index={0}
                  className="h-14 w-14 bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] rounded-xl text-foreground text-xl font-bold data-[active=true]:border-mint data-[active=true]:ring-mint/30 data-[active=true]:ring-[3px] transition-all"
                />
                <InputOTPSlot
                  index={1}
                  className="h-14 w-14 bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] rounded-xl text-foreground text-xl font-bold data-[active=true]:border-mint data-[active=true]:ring-mint/30 data-[active=true]:ring-[3px] transition-all"
                />
                <InputOTPSlot
                  index={2}
                  className="h-14 w-14 bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] rounded-xl text-foreground text-xl font-bold data-[active=true]:border-mint data-[active=true]:ring-mint/30 data-[active=true]:ring-[3px] transition-all"
                />
                <InputOTPSlot
                  index={3}
                  className="h-14 w-14 bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] rounded-xl text-foreground text-xl font-bold data-[active=true]:border-mint data-[active=true]:ring-mint/30 data-[active=true]:ring-[3px] transition-all"
                />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <motion.button
            onClick={onSendCode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="text-mint text-sm hover:underline"
          >
            ارسال مجدد کد
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ===== Step 2: Role Selection (NEW) =====
function StepRole({
  role,
  setRole,
  direction,
}: {
  role: RegisterRole | '';
  setRole: (v: RegisterRole) => void;
  direction: number;
}) {
  return (
    <motion.div
      key="step2-role"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">به چه عنوانی ثبت‌نام می‌کنی؟</h1>
      <p className="text-muted-foreground mb-8">نقش خودت رو انتخاب کن</p>

      <div className="w-full space-y-3">
        {ROLE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = role === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setRole(opt.value)}
              className={`
                w-full min-h-[68px] rounded-xl px-4 py-3 flex items-center gap-4 text-right transition-all duration-200 active:scale-[0.98] border-2
                ${selected
                  ? 'bg-mint/15 border-mint shadow-lg shadow-mint/10'
                  : 'bg-[var(--bg-overlay)] border-[var(--border-strong)] hover:border-[var(--border-strong)]'
                }
              `}
            >
              <div className={`
                w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors
                ${selected ? 'bg-mint/20 text-mint' : 'bg-[var(--bg-elevated)] text-[var(--foreground-muted)]'}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${selected ? 'text-mint' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5 leading-relaxed">
                  {opt.desc}
                </p>
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-mint flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-[var(--bg-deep)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ===== Step 3: Personal Identity =====
function StepIdentity({
  name,
  setName,
  selectedAvatar,
  setSelectedAvatar,
  direction,
}: {
  name: string;
  setName: (v: string) => void;
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;
  direction: number;
}) {
  return (
    <motion.div
      key="step3-identity"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <UserIcon className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">توی روال چی صدات کنیم؟</h1>
      <p className="text-muted-foreground mb-8">اسم و آواتارت رو انتخاب کن</p>

      <div className="w-full space-y-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: علی، سارا، ..."
          className="w-full h-12 bg-[var(--bg-overlay)] border border-[var(--border-strong)] rounded-lg px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/50 transition-all"
          maxLength={30}
        />

        <div className="grid grid-cols-3 gap-3">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className={`
                h-20 rounded-xl flex items-center justify-center text-4xl transition-all duration-200 active:scale-[0.97]
                ${selectedAvatar === avatar
                  ? 'bg-mint/15 border-2 border-mint shadow-lg shadow-mint/20'
                  : 'bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] hover:border-[var(--border-strong)]'
                }
              `}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== Step 4a: Academic Details (STUDENT only) =====
function StepAcademic({
  grade,
  setGrade,
  major,
  setMajor,
  direction,
}: {
  grade: Grade | '';
  setGrade: (v: Grade) => void;
  major: Major | '';
  setMajor: (v: Major) => void;
  direction: number;
}) {
  return (
    <motion.div
      key="step4-academic"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <GraduationCap className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">پایه و رشته تحصیلیت رو انتخاب کن</h1>
      <p className="text-muted-foreground mb-6">برای شخصی‌سازی برنامه‌ات نیاز داریم</p>

      <div className="w-full space-y-6">
        {/* Grade Selection */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">پایه تحصیلی</p>
          <div className="grid grid-cols-2 gap-3">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`
                  min-h-[52px] rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97]
                  ${grade === g
                    ? 'bg-mint/15 border-2 border-mint text-mint'
                    : 'bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] text-foreground/90 hover:border-[var(--border-strong)]'
                  }
                `}
              >
                {GRADE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* Major Selection */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">رشته تحصیلی</p>
          <div className="grid grid-cols-3 gap-3">
            {MAJORS.map((m) => (
              <button
                key={m}
                onClick={() => setMajor(m)}
                className={`
                  min-h-[52px] rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.97]
                  ${major === m
                    ? 'bg-mint/15 border-2 border-mint text-mint'
                    : 'bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] text-foreground/90 hover:border-[var(--border-strong)]'
                  }
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== Step 4b: Institute Name (INSTITUTE_MANAGER only) =====
function StepInstitute({
  instituteName,
  setInstituteName,
  direction,
}: {
  instituteName: string;
  setInstituteName: (v: string) => void;
  direction: number;
}) {
  return (
    <motion.div
      key="step4-institute"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <Building2 className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">آموزشگاهت رو معرفی کن</h1>
      <p className="text-muted-foreground mb-8">نام آموزشگاهی که مدیریتش رو بر عهده داری</p>

      <div className="w-full space-y-6">
        <input
          type="text"
          value={instituteName}
          onChange={(e) => setInstituteName(e.target.value)}
          placeholder="مثلاً: آموزشگاه месроб، موسسه گاج، ..."
          className="w-full h-12 bg-[var(--bg-overlay)] border border-[var(--border-strong)] rounded-lg px-4 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint/50 transition-all"
          maxLength={60}
        />
        <div className="surface-1 rounded-xl p-4 flex items-start gap-3 border border-[var(--border)]">
          <Shield className="w-4 h-4 text-mint shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            بعد از ثبت‌نام می‌تونی مشاوران و دانش‌آموزان آموزشگاهت رو اضافه کنی و
            پیشرفتشون رو دنبال کنی.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ===== Main Wizard Component =====
export default function OnboardingWizard() {
  const { setUser, setOnboardingComplete, setCurrentView, setUserRole } = useAppStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 state
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  // Step 2 state — role selection (NEW)
  const [role, setRole] = useState<RegisterRole | ''>('');

  // Step 3 state
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Step 4 state (STUDENT only)
  const [grade, setGrade] = useState<Grade | ''>('');
  const [major, setMajor] = useState<Major | ''>('');

  // Step 4 state (INSTITUTE_MANAGER only)
  const [instituteName, setInstituteName] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // The wizard has a variable number of steps depending on the selected role:
  //  - STUDENT:           4 (phone → role → identity → academic)
  //  - INSTITUTE_MANAGER: 4 (phone → role → identity → institute)
  //  - ADVISOR:           3 (phone → role → identity) — no step 4
  //
  // We compute `totalSteps` lazily — before a role is selected (step 2) we
  // assume 4 to avoid the dots jumping; once selected, it locks to the real
  // total.
  const totalSteps: number = role === 'ADVISOR' ? 3 : 4;

  // Use functional updater to avoid stale closure issues
  const goToStep = useCallback((step: number) => {
    setCurrentStep((prev) => {
      setDirection(step > prev ? 1 : -1);
      return step;
    });
  }, []);

  // Auto-advance on OTP complete
  useEffect(() => {
    if (otp === '1234') {
      const timer = setTimeout(() => {
        goToStep(2);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [otp, goToStep]);

  const handleSendCode = useCallback(() => {
    if (!showOtp) {
      if (!/^9\d{9}$/.test(phone)) return;
      setShowOtp(true);
      toast.info('کد تایید آزمایشی شما: ۱۲۳۴');
    } else {
      toast.info('کد تایید آزمایشی شما: ۱۲۳۴');
    }
  }, [showOtp, phone]);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 1:
        return showOtp && otp === '1234';
      case 2:
        return role !== '';
      case 3:
        return name.trim().length > 0 && selectedAvatar !== '';
      case 4:
        if (role === 'STUDENT') return grade !== '' && major !== '';
        if (role === 'INSTITUTE_MANAGER') return instituteName.trim().length > 0;
        return false; // ADVISOR never reaches step 4
      default:
        return false;
    }
  }, [currentStep, showOtp, otp, role, name, selectedAvatar, grade, major, instituteName]);

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    // ADVISOR has no step 4 — step 3 is their final step.
    if (role === 'ADVISOR' && currentStep === 3) return;
    if (currentStep < 4) {
      goToStep(currentStep + 1);
    }
  }, [canProceed, currentStep, role, goToStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // Whether the current step is the final step (i.e. the CTA should say "شروع کن"
  // instead of "بعدی").
  const isFinalStep = (() => {
    if (role === 'ADVISOR') return currentStep === 3;
    return currentStep === 4;
  })();

  const handleComplete = useCallback(async () => {
    if (!canProceed() || submitting) return;

    setSubmitting(true);
    try {
      // Persist the account server-side and obtain a signed session cookie.
      const normalizedPhone = phone.startsWith('0') ? phone : `0${phone}`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: name.trim(),
          avatar: selectedAvatar,
          role,
          ...(role === 'STUDENT' ? { grade, major } : {}),
          ...(role === 'INSTITUTE_MANAGER' ? { instituteName: instituteName.trim() } : {}),
          password: '1234',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || 'خطا در ساخت حساب کاربری';
        toast.error(message, {
          style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' },
        });
        setSubmitting(false);
        return;
      }

      // Use the REAL user record (with DB id + assignedAdvisorId/instituteId) returned by the server.
      const u = data.user;
      const realUser: User = {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        grade: (u.grade as Grade) || (role === 'STUDENT' ? (grade as Grade) : 'دوازدهم'),
        major: (u.major as Major) || (role === 'STUDENT' ? (major as Major) : 'تجربی'),
        goal: (u.goal as 'کنکور' | 'نهایی' | 'هر دو') || 'کنکور',
        dailyTargetHours: typeof u.dailyTargetHours === 'number' ? u.dailyTargetHours : 6,
        phone: u.phone,
        assignedAdvisorId: u.assignedAdvisorId || null,
      };

      setUser(realUser);
      setUserRole(u.role as UserRole);
      setOnboardingComplete(true);

      // Kick off background data loads based on role (mirrors LoginPage behaviour).
      const { loadTasksForStudent, loadAdvisorStudents, loadExams } = useAppStore.getState();
      if (u.role === 'STUDENT') {
        setCurrentView('dashboard');
        loadTasksForStudent(realUser.id).catch(() => {});
        loadExams({ studentId: realUser.id }).catch(() => {});
      } else if (u.role === 'ADVISOR') {
        setCurrentView('advisor-dashboard');
        loadAdvisorStudents(realUser.id).catch(() => {});
        loadExams({ advisorId: realUser.id }).catch(() => {});
      } else if (u.role === 'INSTITUTE_MANAGER') {
        setCurrentView('institute-dashboard');
      } else {
        setCurrentView('dashboard');
      }

      toast.success(`خوش امدی، ${realUser.name}`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(62, 180, 137, 0.3)', color: '#3EB489' },
      });
    } catch {
      toast.error('خطا در ارتباط با سرور', {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' },
      });
      setSubmitting(false);
    }
  }, [canProceed, submitting, name, selectedAvatar, role, grade, major, instituteName, phone, setUser, setUserRole, setOnboardingComplete, setCurrentView]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Subtle ambient mint glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: 'radial-gradient(ellipse 600px 300px at 50% 25%, rgba(62, 180, 137, 0.10), transparent 70%)',
        }}
      />
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Step Content */}
        <div className="w-full flex-1 min-h-[420px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 1 && (
              <StepPhone
                phone={phone}
                setPhone={setPhone}
                showOtp={showOtp}
                setShowOtp={setShowOtp}
                otp={otp}
                setOtp={setOtp}
                onSendCode={handleSendCode}
                direction={direction}
              />
            )}
            {currentStep === 2 && (
              <StepRole
                role={role}
                setRole={setRole}
                direction={direction}
              />
            )}
            {currentStep === 3 && (
              <StepIdentity
                name={name}
                setName={setName}
                selectedAvatar={selectedAvatar}
                setSelectedAvatar={setSelectedAvatar}
                direction={direction}
              />
            )}
            {currentStep === 4 && role === 'STUDENT' && (
              <StepAcademic
                grade={grade}
                setGrade={setGrade}
                major={major}
                setMajor={setMajor}
                direction={direction}
              />
            )}
            {currentStep === 4 && role === 'INSTITUTE_MANAGER' && (
              <StepInstitute
                instituteName={instituteName}
                setInstituteName={setInstituteName}
                direction={direction}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <div className="w-full mt-8 flex items-center gap-3">
          {/* Previous button - not shown on step 1 */}
          {currentStep > 1 && (
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 px-5 rounded-xl border border-[var(--border-strong)] text-muted-foreground hover:text-foreground hover:border-[var(--border-strong)] transition-all duration-200 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              قبلی
            </motion.button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Next / CTA button */}
          {!isFinalStep ? (
            <motion.button
              onClick={handleNext}
              disabled={!canProceed()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 px-8 bg-mint hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--bg-deep)] font-bold rounded-xl transition-all duration-200"
            >
              بعدی
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={!canProceed() || submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 px-6 bg-mint hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--bg-deep)] font-bold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'در حال ساخت حساب...' : 'شروع کن'}
            </motion.button>
          )}
        </div>

        {/* Login link — for returning users who already have an account */}
        <div className="w-full text-center mt-6">
          <p className="text-sm text-muted-foreground">
            حساب داری؟{' '}
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="text-mint hover:text-[var(--accent-hover)] font-semibold transition-colors underline-offset-4 hover:underline"
            >
              وارد شو
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
