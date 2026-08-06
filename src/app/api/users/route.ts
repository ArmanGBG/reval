import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== GET /api/users =====
// Returns users filtered by role.
//
// Query params:
//   ?role=STUDENT  → return all students (super-admin only)
//
// Authorization:
//   - SUPER_ADMIN: can list all students across the platform
//   - Anyone else: 403 (use /api/students for advisor/institute-scoped queries)
//
// Response shape: { users: UserRow[] }
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز' },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const where: Record<string, unknown> = { isActive: true };
  if (role) where.role = role;

  const users = await db.user.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      grade: true,
      major: true,
      goal: true,
      dailyTargetHours: true,
      assignedAdvisorId: true,
      instituteId: true,
      createdAt: true,
    },
    take: 500,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      phone: u.phone,
      role: u.role,
      grade: u.grade,
      major: u.major,
      goal: u.goal,
      dailyTargetHours: u.dailyTargetHours,
      assignedAdvisorId: u.assignedAdvisorId,
      instituteId: u.instituteId,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
