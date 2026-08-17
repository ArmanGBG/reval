'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, UserCheck, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Party = { id: string; name: string; avatar: string; publicCode: string; grade?: string | null; major?: string | null };
type Connection = { id: string; initiatedBy: 'STUDENT' | 'ADVISOR'; status: string; student: Party; advisor: Party };

export default function ConnectionManager({ role, onChanged }: { role: 'STUDENT' | 'ADVISOR'; onChanged?: () => void }) {
  const [code, setCode] = useState('');
  const [publicCode, setPublicCode] = useState('');
  const [requests, setRequests] = useState<Connection[]>([]);
  const [assignedAdvisor, setAssignedAdvisor] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connection-requests');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data.requests || []);
      setPublicCode(data.publicCode || '');
      setAssignedAdvisor(data.assignedAdvisor || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'دریافت اطلاعات اتصال انجام نشد');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('reval:relationship-changed', refresh);
    return () => window.removeEventListener('reval:relationship-changed', refresh);
  }, [load]);

  const send = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/connection-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: code.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCode('');
      toast.success('درخواست اتصال ارسال شد');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'ثبت درخواست انجام نشد'); }
    finally { setSubmitting(false); }
  };

  const act = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/connection-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(action === 'ACCEPT' ? 'اتصال فعال شد' : action === 'END' ? 'همکاری پایان یافت' : 'درخواست به‌روزرسانی شد');
      await load();
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'عملیات انجام نشد'); }
  };

  const pending = requests.filter((item) => item.status === 'PENDING');
  const active = requests.find((item) => item.status === 'ACCEPTED');
  if (loading) return <div className="surface-1 rounded-2xl p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-mint" /></div>;

  return (
    <section className="surface-1 rounded-2xl p-4 md:p-5 space-y-4 border border-[var(--border)]">
      <h3 className="font-bold">{role === 'STUDENT' ? 'مشاور من' : 'اتصال دانش‌آموزان'}</h3>
      <div className="rounded-xl bg-[var(--bg-overlay)] p-3 flex items-center justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">کد اختصاصی شما</p><p dir="ltr" className="font-mono font-bold tracking-wider mt-1">{publicCode}</p></div>
        <button onClick={() => { void navigator.clipboard.writeText(publicCode); toast.success('کد کپی شد'); }} className="p-2 rounded-lg bg-mint/10 text-mint"><Copy className="w-4 h-4" /></button>
      </div>
      {role === 'STUDENT' && assignedAdvisor && (
        <div className="rounded-xl border border-mint/25 bg-mint/10 p-3 flex items-center gap-3"><span className="text-2xl">{assignedAdvisor.avatar}</span><div className="flex-1"><p className="text-xs text-muted-foreground">مشاور فعال</p><p className="font-bold">{assignedAdvisor.name}</p></div><UserCheck className="text-mint" /></div>
      )}
      {!active && !(role === 'STUDENT' && assignedAdvisor) && (
        <div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value.trim())} dir="ltr" placeholder={role === 'STUDENT' ? 'کد مشاور' : 'کد دانش‌آموز'} className="flex-1 h-11 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border)] px-3" /><button disabled={submitting || !code} onClick={send} className="px-4 rounded-xl bg-mint text-[var(--bg-deep)] font-bold disabled:opacity-40"><UserPlus className="w-4 h-4" /></button></div>
      )}
      {pending.map((item) => {
        const other = role === 'STUDENT' ? item.advisor : item.student;
        const incoming = item.initiatedBy !== role;
        return <div key={item.id} className="rounded-xl border border-[var(--border)] p-3 flex items-center gap-3"><span className="text-xl">{other.avatar}</span><div className="flex-1"><p className="font-semibold text-sm">{other.name}</p><p className="text-xs text-muted-foreground">{incoming ? 'درخواست اتصال برای شما' : 'در انتظار تایید طرف مقابل'}</p></div>{incoming ? <><button onClick={() => act(item.id, 'ACCEPT')} className="p-2 rounded-lg bg-mint/15 text-mint"><UserCheck className="w-4 h-4" /></button><button onClick={() => act(item.id, 'REJECT')} className="p-2 rounded-lg bg-red-500/10 text-red-400"><X className="w-4 h-4" /></button></> : <button onClick={() => act(item.id, 'CANCEL')} className="text-xs text-red-400">لغو</button>}</div>;
      })}
       {active && (
         <>
           <button
             onClick={() => setEndDialogOpen(true)}
             className="text-xs text-red-400 border border-red-500/20 rounded-lg px-3 py-2"
           >
             پایان همکاری
           </button>
           <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
             <AlertDialogContent dir="rtl" className="surface-2 border-[var(--border-strong)] text-[var(--foreground)]">
               <AlertDialogHeader>
                 <AlertDialogTitle>پایان همکاری با مشاور؟</AlertDialogTitle>
                 <AlertDialogDescription className="text-[var(--foreground-muted)] leading-6">
                   با پایان همکاری، مشاور فعلی از حساب شما حذف می‌شود. برای انجام این کار تأیید کنید.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>انصراف</AlertDialogCancel>
                 <AlertDialogAction
                   onClick={() => {
                     setEndDialogOpen(false);
                     void act(active.id, 'END');
                   }}
                   className="bg-red-500 text-white hover:bg-red-600"
                 >
                   پایان همکاری
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         </>
       )}
    </section>
  );
}
