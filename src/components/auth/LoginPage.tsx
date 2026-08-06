'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, LogIn, Loader2, Shield, GraduationCap, Building2, Crown, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ===== Quick Access Buttons =====
const QUICK_ACCOUNTS = [
  { phone: '09121000000', label: 'سوپر ادمین', icon: Crown, color: 'text-gold', tint: 'bg-gold/10 border-gold/20', accentBorder: 'var(--gold)' },
  { phone: '09121111111', label: 'مدیر آموزشگاه', icon: Building2, color: 'text-mint', tint: 'bg-mint/10 border-mint/20', accentBorder: 'var(--accent)' },
  { phone: '09121234567', label: 'مشاور', icon: Shield, color: 'text-violet-400', tint: 'bg-violet-500/10 border-violet-500/20', accentBorder: '#8B5CF6' },
  { phone: '09131111111', label: 'دانش‌آموز', icon: GraduationCap, color: 'text-mint', tint: 'bg-mint/10 border-mint/20', accentBorder: 'var(--accent)' },
];

export default function LoginPage() {
  const { setUserRole, setUser, setOnboardingComplete } = useAppStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    if (!phone || !password) {
      setError('شماره تلفن و رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ورود');
        toast.error(data.error || 'خطا در ورود', {
          style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' },
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
      const { loadTasksForStudent, loadAdvisorStudents } = useAppStore.getState();
      if (role === 'STUDENT') {
        loadTasksForStudent(data.user.id).catch(() => {
          // Non-blocking — error is already stored in tasksError
        });
      } else if (role === 'ADVISOR') {
        loadAdvisorStudents(data.user.id).catch(() => {
          // Non-blocking — advisor panel shows empty state
        });
      }

      toast.success(`خوش آمدی، ${data.user.name}`, {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(62, 180, 137, 0.3)', color: '#3EB489' },
      });
    } catch {
      setError('خطا در ارتباط با سرور');
      toast.error('خطا در ارتباط با سرور', {
        style: { background: 'var(--bg-overlay)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' },
      });
    } finally {
      setLoading(false);
    }
  }, [phone, password, setUserRole, setUser, setOnboardingComplete]);

  const handleQuickLogin = useCallback((quickPhone: string) => {
    setPhone(quickPhone);
    setPassword('1234');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle ambient background (single radial, low opacity) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 600px 300px at 50% 20%, rgba(62, 180, 137, 0.12), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md mx-auto">
        {/* ============ Logo & Title ============ */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-7"
        >
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-[20px] bg-mint/15 border border-mint/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mint/10">
              <BookOpen className="w-9 h-9 text-mint" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">روال</h1>
          <p className="text-sm text-muted-foreground mt-1.5">مسیر مطالعه‌ات رو هموار کن</p>
        </motion.div>

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
          className={`surface-1 edge-highlight rounded-[20px] p-6 md:p-7 shadow-xl shadow-black/40 transition-colors duration-300 ${error ? 'border-red-500/40' : ''}`}
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

          {/* Password Input */}
          <div className="space-y-2 mb-5">
            <label className="text-xs text-muted-foreground font-medium">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
              <Input
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                dir="ltr"
                placeholder="••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="bg-[var(--bg-overlay)] border-[var(--border-strong)] text-foreground text-right pr-10 pl-10 h-12 focus-visible:border-mint/60 focus-visible:ring-mint/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-[10px] p-3 text-center mb-4"
            >
              <p className="text-xs text-red-400">{error}</p>
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

        {/* ============ Quick Access ============ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <p className="text-[11px] text-muted-foreground">دسترسی سریع (حساب‌های آزمایشی)</p>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.phone}
                  onClick={() => handleQuickLogin(account.phone)}
                  className={`btn-hover flex items-center gap-2.5 p-3 pr-2.5 rounded-[12px] border ${account.tint} hover:border-[var(--border-strong)] text-right relative overflow-hidden`}
                  style={{ borderRightWidth: '3px', borderRightColor: account.accentBorder }}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${account.tint}`}>
                    <Icon className={`w-3.5 h-3.5 ${account.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground font-medium">{account.label}</p>
                    <p className="text-[10px] text-muted-foreground/70 tabular-nums" dir="ltr">{account.phone}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-3">
            رمز عبور همه حساب‌ها: <span dir="ltr" className="text-muted-foreground font-mono">1234</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
