'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { UserRole } from '@/lib/types';
import { isIranianMobileInput, numericInput } from '@/lib/phone';
import { Logo } from '@/components/landing/logo';
import { FloatingLines } from '@/components/landing/floating-lines';

export default function LoginPage() {
  const { setUserRole, setUser, setOnboardingComplete, setCurrentView } = useAppStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  const navigatePublic = useCallback((view: 'landing' | 'onboarding', hash = '') => {
    window.history.pushState({ revalView: view }, '', `${window.location.pathname}${hash}`);
    setCurrentView(view);
  }, [setCurrentView]);

  useEffect(() => {
    if (!error) return;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    if (otpRequested) requestAnimationFrame(() => otpRef.current?.focus());
  }, [otpRequested]);

  const handleLogin = useCallback(async () => {
    if (!isIranianMobileInput(phone) || !/^\d{6}$/.test(otp)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'کد واردشده صحیح نیست');
      const role = data.user.role as UserRole;
      setUserRole(role);
      setUser({
        id: data.user.id, name: data.user.name, avatar: data.user.avatar,
        grade: data.user.grade || 'دوازدهم', major: data.user.major || 'تجربی', phone: data.user.phone,
        assignedAdvisorId: data.user.assignedAdvisorId || null,
      });
      setOnboardingComplete(true);
      const { loadTasksForStudent, loadAdvisorStudents, loadExams } = useAppStore.getState();
      if (role === 'STUDENT') {
        loadTasksForStudent(data.user.id).catch(() => {});
        loadExams({ studentId: data.user.id }).catch(() => {});
      } else if (role === 'ADVISOR') {
        loadAdvisorStudents(data.user.id).catch(() => {});
        loadExams({ advisorId: data.user.id }).catch(() => {});
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'خطا در ارتباط با سرور');
    } finally { setLoading(false); }
  }, [phone, otp, setUserRole, setUser, setOnboardingComplete]);

  const handleRequestOtp = useCallback(async () => {
    if (!isIranianMobileInput(phone)) {
      setError('شماره باید ۱۱ رقم و با 09 شروع شود');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, purpose: 'LOGIN' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ارسال کد انجام نشد');
      setOtp('');
      setOtpRequested(true);
      setSeconds(60);
      if (data.testCode) toast.success(`کد تست: ${data.testCode}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'ارسال کد انجام نشد');
    } finally { setLoading(false); }
  }, [phone]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8" dir="rtl">
      <div className="aurora pointer-events-none absolute inset-0 opacity-35" />
      <FloatingLines />
      <div className="pointer-events-none absolute inset-0 bg-background/35" />

      <div className="relative z-10 w-full max-w-[380px]">
        <button onClick={() => navigatePublic('landing')} className="mx-auto mb-5 block" aria-label="بازگشت به روال">
          <Logo size={46} className="relative right-1 h-[46px] w-auto object-contain" />
        </button>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, x: shaking ? [0, -7, 7, -4, 4, 0] : 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-[var(--bg-elevated)]/85 p-6 shadow-[0_34px_90px_-45px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7"
        >
          <div className="mx-auto mb-7 h-1 w-9 rounded-full bg-white/10" />

          <AnimatePresence mode="wait" initial={false}>
            {!otpRequested ? (
              <motion.div key="phone" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <h1 className="text-center text-xl font-bold text-foreground">ورود</h1>
                <p className="mt-2 text-center text-xs text-muted-foreground">شماره موبایل خود را وارد کنید</p>
                <p className="mb-7 mt-3 text-center text-xs font-semibold text-[var(--warning)]">لطفاً VPNات رو قطع کن! ممنون</p>
                <label className="mb-2 block text-[11px] font-medium text-muted-foreground">شماره موبایل</label>
                <input
                  autoFocus type="tel" inputMode="numeric" dir="ltr" maxLength={11} pattern="09[0-9]{9}"
                  autoComplete="tel-national" placeholder="09123456789" value={phone}
                  onChange={(event) => { setPhone(numericInput(event.target.value, 11)); setError(''); }}
                  onKeyDown={(event) => { if (event.key === 'Enter') handleRequestOtp(); }}
                  className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-left text-sm tracking-wide text-foreground outline-none transition focus:border-mint/45 focus:ring-4 focus:ring-mint/10"
                />
                <button
                  onClick={handleRequestOtp} disabled={loading || !isIranianMobileInput(phone)}
                  className="mt-4 h-12 w-full rounded-xl bg-mint text-sm font-bold text-[#06120c] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                >{loading ? 'در حال ارسال...' : 'دریافت کد'}</button>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <h1 className="text-center text-xl font-bold text-foreground">کد تایید</h1>
                <button onClick={() => { setOtpRequested(false); setOtp(''); setError(''); }} className="mx-auto mb-7 mt-2 block text-xs text-muted-foreground transition hover:text-mint" dir="ltr">
                  {phone} · ویرایش
                </button>
                <div className="relative" onClick={() => otpRef.current?.focus()} dir="ltr">
                  <input
                    ref={otpRef} value={otp} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                    onChange={(event) => { setOtp(numericInput(event.target.value, 6)); setError(''); }}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleLogin(); }}
                    className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                    aria-label="کد تایید شش رقمی"
                  />
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 6 }, (_, index) => {
                      const active = index === otp.length;
                      return <div key={index} className={`relative flex aspect-[0.86] items-center justify-center overflow-hidden rounded-xl border bg-white/[0.03] text-xl font-bold text-foreground transition ${active ? 'border-mint/55 shadow-[0_0_22px_-8px_var(--mint)]' : otp[index] ? 'border-mint/25' : 'border-white/[0.09]'}`}>
                        {active && <motion.span className="absolute inset-[-40%] rounded-full border border-mint/50" animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />}
                        <span className="relative">{otp[index] ?? ''}</span>
                      </div>;
                    })}
                  </div>
                </div>
                <button
                  onClick={handleLogin} disabled={loading || !/^\d{6}$/.test(otp)}
                  className="mt-5 h-12 w-full rounded-xl bg-mint text-sm font-bold text-[#06120c] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                >{loading ? 'در حال بررسی...' : 'ادامه'}</button>
                <div className="mt-5 text-center text-[11px] text-muted-foreground">
                  {seconds > 0 ? `ارسال مجدد تا ${seconds} ثانیه` : <button onClick={handleRequestOtp} disabled={loading} className="font-semibold text-mint">ارسال دوباره</button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="mt-4 text-center text-xs text-[var(--danger)]">{error}</motion.p>}
        </motion.section>

        <p className="mt-5 text-center text-xs text-muted-foreground">حساب ندارید؟ <button onClick={() => navigatePublic('onboarding', '#signup')} className="font-semibold text-mint">ثبت‌نام</button></p>
      </div>
    </main>
  );
}
