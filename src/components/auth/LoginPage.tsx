'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, LogIn, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { setUserRole, setUser, setOnboardingComplete, setCurrentView } = useAppStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  // Trigger shake animation when error changes
  useEffect(() => {
    if (error) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = useCallback(async () => {
    if (!phone || !otpRequested || !/^\d{6}$/.test(otp)) {
      setError('شماره تلفن و کد تایید شش‌رقمی را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ورود');
        toast.error(data.error || 'خطا در ورود', {
          style: { background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--danger)' },
        });
        return;
      }

      // Set user role in store
      const role = data.user.role as UserRole;
      setUserRole(role);

      // Set user profile in store
      setUser({
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar,
        grade: data.user.grade || 'دوازدهم',
        major: data.user.major || 'تجربی',
        goal: data.user.goal || 'کنکور',
        dailyTargetHours: data.user.dailyTargetHours || 6,
        phone: data.user.phone,
        assignedAdvisorId: data.user.assignedAdvisorId || null,
      });

      setOnboardingComplete(true);

      // Load the user's tasks from the API (replaces the old MOCK_TASKS init).
      // For students, this loads their own tasks. For advisors, we load their
      // assigned students list (so they can pick a student and view their tasks).
      // We also load exams for advisors and students in the background.
      const { loadTasksForStudent, loadAdvisorStudents, loadExams } = useAppStore.getState();
      if (role === 'STUDENT') {
        loadTasksForStudent(data.user.id).catch(() => {
          // Non-blocking — error is already stored in tasksError
        });
        loadExams({ studentId: data.user.id }).catch(() => {});
      } else if (role === 'ADVISOR') {
        loadAdvisorStudents(data.user.id).catch(() => {
          // Non-blocking — advisor panel shows empty state
        });
        loadExams({ advisorId: data.user.id }).catch(() => {});
      }

      toast.success(`خوش آمدی، ${data.user.name}`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--success)' },
      });
    } catch {
      setError('خطا در ارتباط با سرور');
      toast.error('خطا در ارتباط با سرور', {
        style: { background: 'var(--bg-overlay)', border: '1px solid var(--border)', color: 'var(--danger)' },
      });
    } finally {
      setLoading(false);
    }
  }, [phone, otp, otpRequested, setUserRole, setUser, setOnboardingComplete]);

  const handleRequestOtp = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'LOGIN' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ارسال کد انجام نشد');
      setOtpRequested(true);
      toast.success(data.testCode ? `کد تست شما: ${data.testCode}` : 'کد تایید ارسال شد');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ارسال کد انجام نشد');
    } finally { setLoading(false); }
  }, [phone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle ambient background (single radial, low opacity) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 600px 300px at 50% 20%, var(--accent-soft), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md mx-auto">
        {/* ============ Logo & Title ============ */}
        <motion.button
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setCurrentView('landing')}
          className="text-center mb-7 block w-full"
        >
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-[20px] bg-mint/15 border border-mint/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/40">
              <BookOpen className="w-9 h-9 text-mint" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">روال</h1>
          <p className="text-sm text-muted-foreground mt-1.5">مسیر مطالعه‌ات رو هموار کن</p>
        </motion.button>

        {/* ============ Login Card ============ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            x: shaking ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
          }}
          transition={{
            opacity: { duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
            y: { duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] },
            x: { duration: 0.5, ease: 'easeInOut' },
          }}
          className={`surface-1 edge-highlight rounded-[20px] p-6 md:p-7 shadow-xl shadow-black/40 transition-colors duration-300 ${error ? 'border-[rgba(229,72,77,0.4)]' : ''}`}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-mint" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">ورود به حساب</h2>
              <p className="text-[11px] text-muted-foreground">شماره تلفن و رمز عبور را وارد کنید</p>
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-2 mb-4">
            <label className="text-xs text-muted-foreground font-medium">شماره تلفن</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="09121234567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-foreground text-right pr-10 h-12 focus-visible:border-mint/60 focus-visible:ring-mint/20"
              />
            </div>
          </div>

          {/* OTP Input */}
          <div className="space-y-2 mb-5">
            <label className="text-xs text-muted-foreground font-medium">کد تایید</label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                dir="ltr"
                placeholder="۱۲۳۴۵۶"
                maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="flex-1 bg-[var(--bg-overlay)] border-[var(--border-strong)] text-foreground text-center tracking-[0.4em] h-12 focus-visible:border-mint/60 focus-visible:ring-mint/20"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || phone.length < 10}
                className="px-3 rounded-lg bg-mint/15 text-mint text-xs disabled:opacity-40"
              >
                {otpRequested ? 'ارسال مجدد' : 'ارسال کد'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.18)] rounded-[10px] p-3 text-center mb-4"
            >
              <p className="text-xs text-[var(--danger)]">{error}</p>
            </motion.div>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="btn-hover glow-hover w-full bg-mint hover:bg-[var(--accent-hover)] text-[var(--bg-deep)] font-bold h-12 text-base border-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                ورود
              </span>
            )}
          </Button>
        </motion.div>

        {/* ============ Sign-up entry ============ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-5 text-center"
        >
          <p className="text-sm text-muted-foreground">
            حساب نداری؟{' '}
            <button
              type="button"
              onClick={() => setCurrentView('onboarding')}
              className="text-mint hover:text-[var(--accent-hover)] font-semibold transition-colors underline-offset-4 hover:underline"
            >
              ثبت‌نام کن
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
