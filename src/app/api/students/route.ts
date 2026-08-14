import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { getWeekDays, toISODate } from '@/lib/persian-date';

// GET /api/students
// Returns real students from the DB.
//
// Query params:
//   ?advisorId=xxx     → only students assigned to this advisor
//   ?instituteId=xxx   → only students in this institute
//
// Authorization:
//   - ADVISOR: can only see students assigned to themselves (advisorId is
//     forced to their own userId, ignoring any client-provided advisorId)
//   - INSTITUTE_MANAGER: can only see students in their own institute
//     (instituteId is forced to their own instituteId)
//   - SUPER_ADMIN: can see all students (no filter forced)
//   - STUDENT: cannot list other students (returns their own record only
//     if no advisorId/instituteId is provided, otherwise 403)
//
// Response shape: { students: StudentRow[] }
export async function GET(request: NextRequest) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { searchParams } = new URL(request.url);
  const requestedAdvisorId = searchParams.get('advisorId');
  const requestedInstituteId = searchParams.get('instituteId');

  const where: Record<string, unknown> = { role: 'STUDENT', isActive: true };

  // Enforce role-based filtering
  if (ctx.user.role === 'ADVISOR') {
    // Advisors can only see their own students — ignore client-provided advisorId
    where.assignedAdvisorId = ctx.userId;
  } else if (ctx.user.role === 'INSTITUTE_MANAGER') {
    // Managers can only see students in their own institute
    where.instituteId = ctx.user.instituteId;
  } else if (ctx.user.role === 'SUPER_ADMIN') {
    // Super admins can filter by any advisorId or instituteId
    if (requestedAdvisorId) where.assignedAdvisorId = requestedAdvisorId;
    if (requestedInstituteId) where.instituteId = requestedInstituteId;
  } else {
    // STUDENT (and any other role) — not allowed to list students
    return NextResponse.json(
      { error: 'دسترسی مجاز نیست' },
      { status: 403 },
    );
  }

  const weekDays = getWeekDays(new Date());
  const weekStart = toISODate(weekDays[0]);
  const weekEnd = toISODate(weekDays[6]);
  const users = await db.user.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      grade: true,
      major: true,
      assignedAdvisorId: true,
      instituteId: true,
      createdAt: true,
      tasks: {
        where: { date: { gte: weekStart, lte: weekEnd }, status: { not: 'DRAFT' } },
        select: { status: true, actualTimeMinutes: true },
      },
    },
  });

  const students = users.map((u) => {
    const completedTasks = u.tasks.filter((task) => task.status === 'COMPLETED');
    const actualMinutes = completedTasks.reduce((sum, task) => sum + (task.actualTimeMinutes ?? 0), 0);
    return ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    phone: u.phone,
    // Return raw values — do NOT fallback. The advisor TaskModal uses these
    // to filter subjects, and a wrong fallback would show the student the
    // wrong subjects. Missing grade/major is surfaced as a block in the UI.
    grade: u.grade,
    major: u.major,
    assignedAdvisorId: u.assignedAdvisorId,
    instituteId: u.instituteId,
    createdAt: u.createdAt.toISOString(),
    reportSummary: {
      studyHoursThisWeek: Math.round((actualMinutes / 60) * 10) / 10,
      taskCompletionRate: u.tasks.length > 0 ? Math.round((completedTasks.length / u.tasks.length) * 100) : 0,
      incompleteCount: u.tasks.filter((task) => task.status === 'INCOMPLETE').length,
    },
  });
  });

  return NextResponse.json({ students });
}
