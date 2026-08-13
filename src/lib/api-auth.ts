// API auth helpers — used by all /api/* routes to enforce authentication,
// role-based authorization, and ownership checks.
//
// The middleware (src/middleware.ts) already verifies the session token and
// sets the `x-user-id` header. These helpers read that header and fetch the
// full user from the DB to enable role checks.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Full authenticated user context — passed to route handlers that call
// `requireAuth` / `requireRole`.
export interface AuthContext {
  userId: string;
  user: {
    id: string;
    role: string; // STUDENT | ADVISOR | INSTITUTE_MANAGER | SUPER_ADMIN
    name: string;
    phone: string;
    instituteId: string | null;
    assignedAdvisorId: string | null;
    isActive: boolean;
  };
}

// Read the verified userId from the x-user-id header (set by middleware).
// Returns null if the header is missing (shouldn't happen for protected
// routes since middleware blocks unauthenticated requests, but we double-check).
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

// Require an authenticated user. Fetches the full user from DB.
// Returns { ctx, error } — if error is set, the handler should return it.
export async function requireAuth(
  request: NextRequest,
): Promise<
  | { ctx: AuthContext; error: null }
  | { ctx: null; error: NextResponse }
> {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'احراز هویت لازم است' },
        { status: 401 },
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
      phone: true,
      instituteId: true,
      assignedAdvisorId: true,
      isActive: true,
    },
  });

  if (!user) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 401 },
      ),
    };
  }

  if (!user.isActive) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'حساب شما غیرفعال شده است' },
        { status: 403 },
      ),
    };
  }

  return { ctx: { userId: user.id, user }, error: null };
}

// Require a specific role (or any of a set of roles).
// Usage: const { ctx, error } = await requireRole(request, ['SUPER_ADMIN']);
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): Promise<
  | { ctx: AuthContext; error: null }
  | { ctx: null; error: NextResponse }
> {
  const { ctx, error } = await requireAuth(request);
  if (error) return { ctx: null, error };

  if (!allowedRoles.includes(ctx.user.role)) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 },
      ),
    };
  }

  return { ctx, error: null };
}

// ===== Task ownership checks =====

// Can this auth context VIEW a student's tasks?
// - The student themselves
// - Their assigned advisor
// - An institute manager of the student's institute
// - A super admin
export async function canViewStudentTasks(
  ctx: AuthContext,
  studentId: string,
): Promise<boolean> {
  if (ctx.user.role === 'SUPER_ADMIN') return true;

  // Student viewing their own tasks
  if (ctx.user.role === 'STUDENT' && ctx.userId === studentId) return true;

  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, assignedAdvisorId: true, instituteId: true },
  });

  if (!student || student.role !== 'STUDENT') return false;

  // Advisor viewing their assigned student's tasks
  if (ctx.user.role === 'ADVISOR') {
    return student.assignedAdvisorId === ctx.userId;
  }

  // Institute manager viewing a student in their institute
  if (ctx.user.role === 'INSTITUTE_MANAGER') {
    return student.instituteId === ctx.user.instituteId;
  }

  return false;
}

// Can this auth context CREATE a task FOR a student?
// - The student themselves (createdBy = 'student')
// - Their assigned advisor (createdBy = 'advisor')
// Super admins and institute managers don't create tasks directly.
export async function canCreateTaskForStudent(
  ctx: AuthContext,
  studentId: string,
): Promise<{ allowed: boolean; createdBy: 'student' | 'advisor' | null }> {
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true, assignedAdvisorId: true, instituteId: true },
  });

  if (!student || student.role !== 'STUDENT') {
    return { allowed: false, createdBy: null };
  }

  // Student creating their own task
  if (ctx.user.role === 'STUDENT' && ctx.userId === studentId) {
    return { allowed: true, createdBy: 'student' };
  }

  // Advisor creating a task for their assigned student
  if (ctx.user.role === 'ADVISOR' && student.assignedAdvisorId === ctx.userId) {
    return { allowed: true, createdBy: 'advisor' };
  }

  return { allowed: false, createdBy: null };
}

// Can this auth context MODIFY/DELETE a specific task?
// - The task's student (owner)
// - The student's assigned advisor
// - A super admin
export async function canModifyTask(
  ctx: AuthContext,
  taskId: string,
): Promise<boolean> {
  if (ctx.user.role === 'SUPER_ADMIN') return true;

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { studentId: true, createdBy: true },
  });

  if (!task) return false;

  if (ctx.user.role === 'STUDENT') return task.studentId === ctx.userId && task.createdBy === 'student';
  return canViewStudentTasks(ctx, task.studentId);
}

// ===== Chapter / Topic ownership checks =====
// These prevent cross-subject access via URL manipulation (bug 9 + 10):
// e.g. /api/subjects/subjectA/chapters/chapter-of-B/topics must NOT work.

/**
 * Verify that a chapter belongs to the subject in the URL path.
 * Fetches chapter → gradeSubject → subjectId and compares.
 * Returns the chapter (with gradeSubject) if ownership matches, null otherwise.
 */
export async function verifyChapterOwnership(
  subjectId: string,
  chapterId: string,
): Promise<{ id: string; gradeSubjectId: string; chapterNo: number; pageStart: number | null; pageEnd: number | null; isLastPage: boolean } | null> {
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      gradeSubjectId: true,
      chapterNo: true,
      pageStart: true,
      pageEnd: true,
      isLastPage: true,
      gradeSubject: { select: { subjectId: true } },
    },
  });
  if (!chapter) return null;
  if (chapter.gradeSubject.subjectId !== subjectId) return null;
  return chapter;
}

/**
 * Verify that a chapter belongs to the subject in the URL path,
 * and return it with full topic info (for topic-within-chapter validation).
 * Used by topic routes.
 */
export async function verifyChapterOwnershipWithTopics(
  subjectId: string,
  chapterId: string,
): Promise<{ id: string; gradeSubjectId: string; pageStart: number | null; pageEnd: number | null; isLastPage: boolean } | null> {
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      gradeSubjectId: true,
      pageStart: true,
      pageEnd: true,
      isLastPage: true,
      gradeSubject: { select: { subjectId: true } },
    },
  });
  if (!chapter) return null;
  if (chapter.gradeSubject.subjectId !== subjectId) return null;
  return chapter;
}

export const TASK_FIELD_TYPES = ['کنکور', 'نهایی'] as const;
export type TaskFieldType = (typeof TASK_FIELD_TYPES)[number];

export function isTaskFieldType(value: unknown): value is TaskFieldType {
  return TASK_FIELD_TYPES.includes(value as TaskFieldType);
}

export async function getEligibleTaskSubject(studentId: string, subjectId: string, fieldType: TaskFieldType) {
  const student = await db.user.findUnique({ where: { id: studentId }, select: { grade: true, major: true } });
  if (!student?.grade || !student.major) return null;
  // Konkur planning spans all high-school grades in the student's major.
  // Final-exam tasks remain tied to the student's exact grade and major.
  const grade = fieldType === 'کنکور' ? {} : { grade: student.grade };
  return db.subject.findFirst({
    where: {
      id: subjectId,
      isActive: true,
      ...(fieldType === 'کنکور' ? { isKonkur: true } : {}),
      grades: { some: { ...grade, major: student.major, isActive: true } },
    },
    select: { id: true, name: true, color: true },
  });
}

export async function validateTaskCurriculum(input: { subjectId: string; chapterId?: string | null; topicId?: string | null; topicIds?: string[] | null; topicModeId?: string | null }) {
  if (input.topicIds != null && !Array.isArray(input.topicIds)) return null;
  if (input.topicIds?.some((id) => typeof id !== 'string' || !id)) return null;
  const topicIds = [...new Set(input.topicIds?.length ? input.topicIds : input.topicId ? [input.topicId] : [])];
  const [chapter, topic, mode] = await Promise.all([
    input.chapterId ? db.chapter.findUnique({ where: { id: input.chapterId }, select: { id: true, title: true, gradeSubject: { select: { subjectId: true } } } }) : null,
    topicIds.length ? db.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, title: true, topicNo: true, chapterId: true, chapter: { select: { gradeSubject: { select: { subjectId: true } } } } }, orderBy: { topicNo: 'asc' } }) : [],
    input.topicModeId ? db.topicMode.findUnique({ where: { id: input.topicModeId }, select: { title: true, subjectId: true } }) : null,
  ]);
  if (input.chapterId && (!chapter || chapter.gradeSubject.subjectId !== input.subjectId)) return null;
  if (topic.length !== topicIds.length || topic.some((item) => item.chapter.gradeSubject.subjectId !== input.subjectId)) return null;
  if (input.topicModeId && (!mode || mode.subjectId !== input.subjectId)) return null;
  if (chapter && topic.some((item) => item.chapterId !== chapter.id)) return null;
  if (mode && topic.length) return null;
  const topicSummary = topic.length
    ? [chapter?.title, ...topic.map((item) => item.title)].filter(Boolean).join(' · ')
    : chapter?.title ?? mode?.title ?? null;
  return { topic: topicSummary, topicIds, topics: topic.map(({ chapter: _chapter, ...item }) => item) };
}

export function isValidTaskPageRange(start: unknown, end: unknown) {
  const valid = (value: unknown) => value == null || (Number.isInteger(value) && (value as number) >= 1);
  return valid(start) && valid(end) && !(typeof start === 'number' && typeof end === 'number' && start > end);
}
