'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Flame,
  ShieldCheck,
  Target,
  Clock,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersianDateRangePicker, PersianDateRangeValue } from '@/components/shared/PersianDateRangePicker';
import { toISODate } from '@/lib/persian-date';

// ==========================================
// DATE FORMATTER (Native Jalali)
// ==========================================

const formatToJalali = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

// ==========================================
// CUSTOM TOOLTIPS
// ==========================================

const CustomTooltip = ({ active, payload, label, unit, color = '#22c55e' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl min-w-[130px]" dir="rtl">
        <p className="text-zinc-400 text-xs mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-zinc-50 font-bold text-sm">
            {payload[0].value?.toLocaleString('fa-IR')} <span className="font-normal text-zinc-400 text-xs">{unit}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const FunnelTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl min-w-[140px]" dir="rtl">
        <p className="text-zinc-400 text-xs mb-1.5">{payload[0].payload.name}</p>
        <p className="text-zinc-50 font-bold text-sm">
          {payload[0].value?.toLocaleString('fa-IR')} <span className="font-normal text-zinc-400 text-xs">کاربر</span>
        </p>
      </div>
    );
  }
  return null;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SuperAdminDashboard() {
  // 1. Manage Persian Date Range State (defaults to last 30 days)
  const [dateRange, setDateRange] = useState<PersianDateRangeValue>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: toISODate(start),
      end: toISODate(end),
    };
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch data with dateRange in dependency array
  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard?startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (res.ok) {
          const json = await res.json();
          setDashboardData(json);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [dateRange]);

  // 3. Format Date labels using Native Jalali toLocaleDateString
  const formattedDailyGrowth = dashboardData?.growthTrend?.map((item: any) => ({
    ...item,
    formattedDate: formatToJalali(item.date),
  })) || [];

  const formattedCumulativeGrowth = dashboardData?.cumulativeGrowthTrend?.map((item: any) => ({
    ...item,
    formattedDate: formatToJalali(item.date),
  })) || [];

  const formattedCumulativeTasks = dashboardData?.cumulativeTasksTrend?.map((item: any) => ({
    ...item,
    formattedDate: formatToJalali(item.date),
  })) || [];

  const formattedMatchesTrend = dashboardData?.matchesTrend?.map((item: any) => ({
    ...item,
    formattedDate: formatToJalali(item.date),
  })) || [];

  const funnelData = dashboardData?.activationFunnel ? [
    { name: 'ثبت‌نام', value: dashboardData.activationFunnel.registered || 0 },
    { name: 'تایید شماره', value: dashboardData.activationFunnel.verified || 0 },
    { name: 'اولین فعالیت', value: dashboardData.activationFunnel.activated || 0 },
    { name: 'دریافت مشاور', value: dashboardData.activationFunnel.matched || 0 },
  ] : [];

  // Sparkline data from recent daily signups
  const sparklineData = formattedDailyGrowth.slice(-7).map((d: any) => ({ value: d.signups }));

  // Pending Requests (placeholder empty state)
  const pendingRequests: any[] = [];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8 font-sans text-zinc-50" dir="rtl">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">داشبورد کلان مدیریتی</h1>
          </div>
          <p className="text-zinc-400 text-sm">نمای لحظه‌ای شاخص‌های کلیدی عملکرد (KPIs) پلتفرم روال</p>
        </div>

        {/* Existing Custom Persian Date Range Picker */}
        <div className="relative z-30">
          <PersianDateRangePicker
            value={dateRange}
            onChange={(nextRange) => {
              if (nextRange) {
                setDateRange(nextRange);
              }
            }}
            maxDays={90}
          />
        </div>
      </header>

      {/* LOADING STATE */}
      {isLoading && !dashboardData && (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
          <p className="text-zinc-400 text-sm">در حال دریافت اطلاعات سیستم...</p>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      {dashboardData && (
        <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          
          {/* ROW 1: VITALS (5 CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            
            {/* 1. DAU */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none overflow-hidden relative">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-400 text-sm font-medium">کاربران فعال روزانه</CardTitle>
                <Users className="w-4 h-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {dashboardData.vitals?.dau?.toLocaleString('fa-IR')}
                </div>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  آمار لحظه‌ای سیستم
                </p>
                {/* Dynamic Sparkline */}
                {sparklineData.length > 0 && (
                  <div className="h-12 w-full mt-2 absolute bottom-0 left-0 right-0 opacity-40 pointer-events-none" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id="sparklineGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#sparklineGreen)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Today's / Period Signups */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-400 text-sm font-medium">ثبت‌نام‌های دوره</CardTitle>
                <UserPlus className="w-4 h-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {dashboardData.vitals?.todaySignups?.toLocaleString('fa-IR')}
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  کل دانشجویان: {dashboardData.vitals?.totalStudents?.toLocaleString('fa-IR')}
                </p>
              </CardContent>
            </Card>

            {/* 3. Consistency Rate */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-400 text-sm font-medium">کاربران مستمر</CardTitle>
                <Flame className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {dashboardData.consistency?.weeklyConsistentStudents?.toLocaleString('fa-IR')}
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  +۳ فعالیت در دوره
                </p>
              </CardContent>
            </Card>

            {/* 4. Active Consultations */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-400 text-sm font-medium">مشاوره‌های فعال</CardTitle>
                <ShieldCheck className="w-4 h-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {dashboardData.vitals?.activeMatches?.toLocaleString('fa-IR')}
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  ارتباطات تایید شده
                </p>
              </CardContent>
            </Card>

            {/* 5. NEW: Conversion Rate */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-zinc-400 text-sm font-medium">نرخ تبدیل به مشاوره</CardTitle>
                <Target className="w-4 h-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {dashboardData.vitals?.conversionRate?.toLocaleString('fa-IR') ?? '۰'}٪
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  از کل کاربران ثبت‌نامی
                </p>
              </CardContent>
            </Card>

          </div>

          {/* ROW 2: MAIN DAILY GROWTH CHART */}
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-none mb-6">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white">روند روزانه ثبت‌نام کاربران</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedDailyGrowth} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDailySignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="formattedDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip unit="ثبت‌نام" color="#22c55e" />} 
                      cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="signups" 
                      stroke="#22c55e" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorDailySignups)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ROW 3: NEW CHARTS GRID (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Chart A: Cumulative Signups Growth */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">رشد تجمعی کاربران (Cumulative Growth)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedCumulativeGrowth} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCumulativeUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="formattedDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }}
                      />
                      <Tooltip 
                        content={<CustomTooltip unit="کاربر تجمعی" color="#14b8a6" />} 
                        cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#14b8a6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorCumulativeUsers)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart B: Cumulative Tasks Trend */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">روند تجمعی تسک‌ها (Tasks Engagement)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedCumulativeTasks} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCumulativeTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="formattedDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }}
                      />
                      <Tooltip 
                        content={<CustomTooltip unit="تسک تجمعی" color="#8b5cf6" />} 
                        cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalTasks" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorCumulativeTasks)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ROW 4: MATCHES TREND & ACTIVATION FUNNEL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
            {/* Chart C: Connections / Matches Trend */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">روند روزانه تخصیص به مشاور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedMatchesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={24}>
                      <XAxis 
                        dataKey="formattedDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'inherit' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        content={<CustomTooltip unit="اتصال جدید" color="#22c55e" />} 
                        cursor={{ fill: '#27272a' }} 
                      />
                      <Bar dataKey="matches" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activation Funnel */}
            <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">قیف تبدیل دوره (Activation Funnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }} barSize={28}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#e4e4e7', fontSize: 13, fontFamily: 'inherit' }} 
                        width={90}
                      />
                      <Tooltip content={<FunnelTooltip />} cursor={{ fill: '#27272a' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`rgba(34, 197, 94, ${1 - index * 0.2})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ROW 5: RECENT REQUESTS */}
          <Card className="bg-zinc-900/50 border-zinc-800 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-white">درخواست‌های مشاوره اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{req.name}</p>
                          <p className="text-xs text-zinc-500">{req.time}</p>
                        </div>
                      </div>
                      <button className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-60">
                  <ShieldCheck className="w-10 h-10 text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-400 text-center">درخواستی در انتظار تایید نیست.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
