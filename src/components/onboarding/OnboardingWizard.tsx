'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Phone, User as UserIcon, GraduationCap, Target, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAppStore } from '@/lib/store';
import { AVATARS } from '@/lib/constants/mockData';
import type { Grade, Major, Goal, User } from '@/lib/types';

// ===== Constants =====
const GRADES: Grade[] = ['دهم', 'یازدهم', 'دوازدهم', 'پشت کنکوری'];
const GRADE_LABELS: Record<Grade, string> = {
  'دهم': 'پایه دهم',
  'یازدهم': 'پایه یازدهم',
  'دوازدهم': 'پایه دوازدهم',
  'پشت کنکوری': 'پشت کنکوری',
};
const MAJORS: Major[] = ['تجربی', 'ریاضی', 'انسانی', 'معارف'];
const GOALS: Goal[] = ['کنکور', 'نهایی', 'هر دو'];
const DAILY_HOURS = [4, 6, 8, 10];

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
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((step) => (
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

// ===== Step 2: Personal Identity =====
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
      key="step2"
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

// ===== Step 3: Academic Details =====
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
      key="step3"
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
          <div className="grid grid-cols-2 gap-3">
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

// ===== Step 4: Goals & Routine =====
function StepGoals({
  goal,
  setGoal,
  dailyHours,
  setDailyHours,
  direction,
}: {
  goal: Goal | '';
  setGoal: (v: Goal) => void;
  dailyHours: number | null;
  setDailyHours: (v: number) => void;
  direction: number;
}) {
  return (
    <motion.div
      key="step4"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-16 h-16 rounded-2xl bg-mint/15 flex items-center justify-center mb-6">
        <Target className="w-8 h-8 text-mint" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-6">هدف‌گذاری مطالعه</h1>

      <div className="w-full space-y-8">
        {/* Goal Selection */}
        <div>
          <p className="text-lg font-medium text-foreground mb-3">تمرکز اصلیت رو کدوم مسیره؟</p>
          <div className="flex flex-wrap gap-3">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`
                  h-12 px-5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]
                  ${goal === g
                    ? 'bg-mint/15 border-2 border-mint text-mint'
                    : 'bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] text-foreground/90 hover:border-[var(--border-strong)]'
                  }
                `}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Hours Selection */}
        <div>
          <p className="text-lg font-medium text-foreground mb-3">هدف‌گذاری ساعت مطالعه روزانه؟</p>
          <div className="flex flex-wrap gap-3">
            {DAILY_HOURS.map((h) => (
              <button
                key={h}
                onClick={() => setDailyHours(h)}
                className={`
                  h-12 min-w-[72px] px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]
                  ${dailyHours === h
                    ? 'bg-mint/15 border-2 border-mint text-mint'
                    : 'bg-[var(--bg-overlay)] border-2 border-[var(--border-strong)] text-foreground/90 hover:border-[var(--border-strong)]'
                  }
                `}
              >
                {h === 10 ? '۱۰+' : toPersianNum(h)} ساعت
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== Helper: Number to Persian =====
function toPersianNum(n: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

// ===== Main Wizard Component =====
export default function OnboardingWizard() {
  const { setUser, setOnboardingComplete, setCurrentView } = useAppStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 state
  const [phone, setPhone] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  // Step 2 state
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Step 3 state
  const [grade, setGrade] = useState<Grade | ''>('');
  const [major, setMajor] = useState<Major | ''>('');

  // Step 4 state
  const [goal, setGoal] = useState<Goal | ''>('');
  const [dailyHours, setDailyHours] = useState<number | null>(null);

  // Submission state — while we're creating the account on the server we lock
  // the CTA button so the user can't double-submit.
  const [submitting, setSubmitting] = useState(false);

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
        return name.trim().length > 0 && selectedAvatar !== '';
      case 3:
        return grade !== '' && major !== '';
      case 4:
        return goal !== '' && dailyHours !== null;
      default:
        return false;
    }
  }, [currentStep, showOtp, otp, name, selectedAvatar, grade, major, goal, dailyHours]);

  const handleNext = useCallback(() => {
    if (!canProceed()) return;
    if (currentStep < 4) {
      goToStep(currentStep + 1);
    }
  }, [canProceed, currentStep, goToStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleComplete = useCallback(async () => {
    if (!canProceed() || submitting) return;

    setSubmitting(true);
    try {
      // Persist the account server-side and obtain a signed session cookie.
      // Without this step, the client would *think* the user is logged in
      // (localStorage flag) but every subsequent /api/* call would 401 with
      // "احراز هویت لازم است" — which was the root cause of the task-creation bug.
      //
      // The onboarding OTP is '1234'; we reuse it as the account password so
      // the same credential also works against /api/auth/login later.
      // `phone` is captured without the leading 0 (the wizard validates /^9\d{9}$/),
      // so we re-add the 0 to match the seeded format.
      const normalizedPhone = phone.startsWith('0') ? phone : `0${phone}`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          name: name.trim(),
          avatar: selectedAvatar,
          grade,
          major,
          goal,
          dailyTargetHours: dailyHours,
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

      // Use the REAL user record (with DB id + assignedAdvisorId) returned by the server.
      const u = data.user;
      const realUser: User = {
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        grade: (u.grade as Grade) || (grade as Grade),
        major: (u.major as Major) || (major as Major),
        goal: (u.goal as Goal) || (goal as Goal),
        dailyTargetHours: typeof u.dailyTargetHours === 'number' ? u.dailyTargetHours : (dailyHours as number),
        phone: u.phone,
        assignedAdvisorId: u.assignedAdvisorId || null,
      };

      setUser(realUser);
      setOnboardingComplete(true);
      setCurrentView('dashboard');

      // Kick off background data loads for the new student (mirrors LoginPage
      // behaviour) so the dashboard isn't empty on first render.
      const { loadTasksForStudent, loadExams } = useAppStore.getState();
      loadTasksForStudent(realUser.id).catch(() => {});
      loadExams({ studentId: realUser.id }).catch(() => {});

      toast.success(`خوش امدی، ${realUser.name}`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(62, 180, 137, 0.3)', color: '#3EB489' },
      });
    } catch {
      toast.error('خطا در ارتباط با سرور', {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' },
      });
      setSubmitting(false);
    }
  }, [canProceed, submitting, name, selectedAvatar, grade, major, goal, dailyHours, phone, setUser, setOnboardingComplete, setCurrentView]);

  const isFinalStep = currentStep === 4;

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
        <ProgressIndicator currentStep={currentStep} />

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
              <StepIdentity
                name={name}
                setName={setName}
                selectedAvatar={selectedAvatar}
                setSelectedAvatar={setSelectedAvatar}
                direction={direction}
              />
            )}
            {currentStep === 3 && (
              <StepAcademic
                grade={grade}
                setGrade={setGrade}
                major={major}
                setMajor={setMajor}
                direction={direction}
              />
            )}
            {currentStep === 4 && (
              <StepGoals
                goal={goal}
                setGoal={setGoal}
                dailyHours={dailyHours}
                setDailyHours={setDailyHours}
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
      </div>
    </div>
  );
}
