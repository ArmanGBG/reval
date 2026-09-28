import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// Next.js Route Cache: Cache this expensive dashboard aggregation for 30 minutes
export const revalidate = 1800; 

export async function GET(request: NextRequest) {
  // 1. Authorization: Only SUPER_ADMIN allowed
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  // 2. Parse Dynamic Date Range from Query Parameters
  const { searchParams } = request.nextUrl;
  const startDateParam = searchParams.get('startDate') || searchParams.get('from');
  const endDateParam = searchParams.get('endDate') || searchParams.get('to');

  const now = new Date();

  // Parse endDate (fallback to current time)
  let endDate = now;
  if (endDateParam) {
    const parsedEnd = new Date(endDateParam);
    if (!isNaN(parsedEnd.getTime())) {
      if (endDateParam.length === 10) {
        parsedEnd.setUTCHours(23, 59, 59, 999);
      }
      endDate = parsedEnd;
    }
  }

  // Parse startDate (fallback to 30 days before endDate)
  let startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (startDateParam) {
    const parsedStart = new Date(startDateParam);
    if (!isNaN(parsedStart.getTime())) {
      if (startDateParam.length === 10) {
        parsedStart.setUTCHours(0, 0, 0, 0);
      }
      startDate = parsedStart;
    }
  } else {
    startDate.setUTCHours(0, 0, 0, 0);
  }

  // Ensure chronological order
  if (startDate > endDate) {
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  try {
    // 3. Execute aggregations concurrently within Promise.all
    const [
      totalStudents,
      periodSignups,
      dauTasks,
      activeMatches,
      recentSignups,
      funnelRegistered,
      funnelVerified,
      funnelActivated,
      funnelMatched,
      periodConsistentTasks,
      // Baselines for cumulative data (records created before startDate)
      usersBaseline,
      tasksBaseline,
      // Trend data within date range
      periodTasks,
      periodMatches
    ] = await Promise.all([
      // --- Vitals ---
      db.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        }
      }),
      db.task.findMany({
        where: {
          updatedAt: { gte: startDate, lte: endDate }
        },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
      db.connectionRequest.count({
        where: { status: 'ACCEPTED' }
      }),

      // --- Growth Trend (Signups within selected range) ---
      db.user.findMany({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        select: { createdAt: true }
      }),

      // --- Activation Funnel (Students registered in the selected period) ---
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null
        }
      }),
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          phoneVerifiedAt: { not: null },
          deletedAt: null
        }
      }),
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          deletedAt: null,
          tasks: { some: {} }
        }
      }),
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { gte: startDate, lte: endDate },
          assignedAdvisorId: { not: null },
          deletedAt: null
        }
      }),

      // --- Consistency Metric ---
      db.task.groupBy({
        by: ['studentId'],
        where: {
          completed: true,
          updatedAt: { gte: startDate, lte: endDate }
        },
        _count: true,
      }),

      // --- Cumulative Baselines (Created BEFORE startDate) ---
      db.user.count({
        where: {
          role: 'STUDENT',
          createdAt: { lt: startDate },
          deletedAt: null
        }
      }),
      db.task.count({
        where: {
          createdAt: { lt: startDate }
        }
      }),

      // --- Period Tasks & Matches for Trend Aggregation ---
      db.task.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true }
      }),
      db.connectionRequest.findMany({
        where: {
          status: 'ACCEPTED',
          createdAt: { gte: startDate, lte: endDate }
        },
        select: { createdAt: true }
      })
    ]);

    // 4. Data Processing for Trends & Cumulative Metrics

    // Active Users in period
    const dau = dauTasks.length;

    // Date range buckets
    const signupsMap = new Map<string, number>();
    const tasksMap = new Map<string, number>();
    const matchesMap = new Map<string, number>();

    const cursor = new Date(startDate);
    cursor.setUTCHours(0, 0, 0, 0);

    const endLimit = new Date(endDate);
    endLimit.setUTCHours(0, 0, 0, 0);

    while (cursor <= endLimit) {
      const dateString = cursor.toISOString().split('T')[0];
      signupsMap.set(dateString, 0);
      tasksMap.set(dateString, 0);
      matchesMap.set(dateString, 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    // Tally daily signups
    recentSignups.forEach((user) => {
      const dateString = user.createdAt.toISOString().split('T')[0];
      if (signupsMap.has(dateString)) {
        signupsMap.set(dateString, (signupsMap.get(dateString) || 0) + 1);
      }
    });

    // Tally daily tasks
    periodTasks.forEach((task) => {
      const dateString = task.createdAt.toISOString().split('T')[0];
      if (tasksMap.has(dateString)) {
        tasksMap.set(dateString, (tasksMap.get(dateString) || 0) + 1);
      }
    });

    // Tally daily accepted connections
    periodMatches.forEach((match) => {
      const dateString = match.createdAt.toISOString().split('T')[0];
      if (matchesMap.has(dateString)) {
        matchesMap.set(dateString, (matchesMap.get(dateString) || 0) + 1);
      }
    });

    // Generate cumulative & daily trend arrays
    const growthTrend: { date: string; signups: number }[] = [];
    const cumulativeGrowthTrend: { date: string; total: number }[] = [];
    const cumulativeTasksTrend: { date: string; totalTasks: number }[] = [];
    const matchesTrend: { date: string; matches: number }[] = [];

    let runningTotalUsers = usersBaseline;
    let runningTotalTasks = tasksBaseline;

    for (const [date, signups] of signupsMap.entries()) {
      runningTotalUsers += signups;
      const tasksCount = tasksMap.get(date) || 0;
      runningTotalTasks += tasksCount;
      const matchCount = matchesMap.get(date) || 0;

      growthTrend.push({ date, signups });
      cumulativeGrowthTrend.push({ date, total: runningTotalUsers });
      cumulativeTasksTrend.push({ date, totalTasks: runningTotalTasks });
      matchesTrend.push({ date, matches: matchCount });
    }

    // Consistency calculation
    const consistentStudents = periodConsistentTasks.filter((g) => g._count >= 3).length;

    // Conversion Rate calculation
    const conversionRate = funnelRegistered > 0
      ? Number(((funnelMatched / funnelRegistered) * 100).toFixed(1))
      : 0;

    // 5. Construct Final Response Payload
    const payload = {
      vitals: {
        totalStudents,
        todaySignups: periodSignups,
        dau,
        activeMatches,
        conversionRate
      },
      growthTrend,
      cumulativeGrowthTrend,
      cumulativeTasksTrend,
      matchesTrend,
      activationFunnel: {
        registered: funnelRegistered,
        verified: funnelVerified,
        activated: funnelActivated,
        matched: funnelMatched,
        conversionRate
      },
      consistency: {
        weeklyConsistentStudents: consistentStudents
      }
    };

    return NextResponse.json(payload);

  } catch (err) {
    console.error('Super Admin Dashboard KPI Error:', err);
    return NextResponse.json(
      { error: 'خطای سرور در دریافت اطلاعات داشبورد' },
      { status: 500 }
    );
  }
}
