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
    deletedAt: Date | null;
    institute: { status: string; deletedAt: Date | null } | null;
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
      deletedAt: true,
      institute: { select: { status: true, deletedAt: true } },
    },
  });

  if (!user || user.deletedAt) {
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

  if (user.role !== 'SUPER_ADMIN' && user.institute && (user.institute.deletedAt || user.institute.status === 'suspended')) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'دسترسی آموزشگاه شما تعلیق شده است', code: 'INSTITUTE_SUSPENDED' },
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
// Students manage their own tasks. Advisors manage only tasks they created.
// Viewing an assigned student's tasks does not imply modification rights.
export async function canModifyTask(
  ctx: AuthContext,
  taskId: string,
): Promise<boolean> {
  if (ctx.user.role === 'SUPER_ADMIN') return true;

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { studentId: true, createdBy: true, createdById: true, status: true },
  });

  if (!task) return false;

  if (ctx.user.role === 'STUDENT') return task.studentId === ctx.userId && task.createdBy === 'student';
  if (ctx.user.role === 'ADVISOR') {
    return task.createdBy === 'advisor'
      && task.createdById === ctx.userId
      && task.status !== 'COMPLETED'
      && task.status !== 'SKIPPED'
      && await canViewStudentTasks(ctx, task.studentId);
  }
  return false;
}

// Plan editing is broader than task ownership: an assigned advisor can revise
// the study plan even when the task was created by the student or another
// advisor. Execution results and destructive actions use canModifyTask.
export async function canEditAssignedStudentPlan(
  ctx: AuthContext,
  studentId: string,
): Promise<boolean> {
  return ctx.user.role === 'ADVISOR' && await canViewStudentTasks(ctx, studentId);
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
): Promise<{ id: string; gradeSubjectId: string; chapterNo: number; pageStart: number | null; pageEnd: number | null } | null> {
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, isActive: true, gradeSubject: { isActive: true, subject: { isActive: true } } },
    select: {
      id: true,
      gradeSubjectId: true,
      chapterNo: true,
      pageStart: true,
      pageEnd: true,
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
): Promise<{ id: string; gradeSubjectId: string; pageStart: number | null; pageEnd: number | null } | null> {
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, isActive: true, gradeSubject: { isActive: true, subject: { isActive: true } } },
    select: {
      id: true,
      gradeSubjectId: true,
      pageStart: true,
      pageEnd: true,
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

export interface TaskCurriculumInput {
  studentId: string;
  subjectId: string;
  fieldType: TaskFieldType;
  curriculumMode: unknown;
  allowSubjectOnly?: boolean;
  chapterId?: unknown;
  topicId?: unknown;
  topicIds?: unknown;
  topicModeId?: unknown;
  topicModeSubtopicIds?: unknown;
  pageStart?: unknown;
  pageEnd?: unknown;
}

export async function validateTaskCurriculum(input: TaskCurriculumInput) {
  const student = await db.user.findFirst({
    where: { id: input.studentId, role: 'STUDENT', isActive: true },
    select: { grade: true, major: true },
  });
  if (!student?.grade || !student.major) return null;
  if (!isValidTaskPageRange(input.pageStart, input.pageEnd)) return null;

  const topicIdsInput = input.topicIds == null ? [] : input.topicIds;
  const subtopicIdsInput = input.topicModeSubtopicIds == null ? [] : input.topicModeSubtopicIds;
  if (!Array.isArray(topicIdsInput) || topicIdsInput.some((id) => typeof id !== 'string' || !id)) return null;
  if (!Array.isArray(subtopicIdsInput) || subtopicIdsInput.some((id) => typeof id !== 'string' || !id)) return null;
  if (input.topicId != null && (typeof input.topicId !== 'string' || !input.topicId)) return null;
  if (input.chapterId != null && (typeof input.chapterId !== 'string' || !input.chapterId)) return null;
  if (input.topicModeId != null && (typeof input.topicModeId !== 'string' || !input.topicModeId)) return null;

  const requestedTopicIds = [...new Set(topicIdsInput as string[])];
  if (typeof input.topicId === 'string' && requestedTopicIds.length && !requestedTopicIds.includes(input.topicId)) return null;
  const topicIds = requestedTopicIds.length ? requestedTopicIds : typeof input.topicId === 'string' ? [input.topicId] : [];
  const subtopicIds = [...new Set(subtopicIdsInput as string[])];
  const gradeEligibility = {
    isActive: true,
    major: student.major,
    ...(input.fieldType === 'کنکور' ? { isKonkur: true } : { isFinal: true, grade: student.grade }),
    subject: { id: input.subjectId, isActive: true },
  };

  if (input.curriculumMode !== 'BOOK' && input.curriculumMode !== 'THEMATIC') {
    const hasCurriculumSelection =
      input.chapterId != null ||
      input.topicId != null ||
      topicIds.length > 0 ||
      input.topicModeId != null ||
      subtopicIds.length > 0 ||
      input.pageStart != null ||
      input.pageEnd != null;
    if (!input.allowSubjectOnly || input.curriculumMode != null || hasCurriculumSelection) return null;

    const gradeSubject = await db.gradeSubject.findFirst({
      where: gradeEligibility,
      select: { subject: { select: { id: true, name: true, color: true } } },
    });
    if (!gradeSubject) return null;
    return {
      subject: gradeSubject.subject,
      topic: null,
      topicIds: [] as string[],
      subtopicIds: [] as string[],
      mode: null,
      chapterId: null,
      topicId: null,
      topicModeId: null,
      pageStart: null,
      pageEnd: null,
    };
  }

  if (input.curriculumMode === 'BOOK') {
    if (typeof input.chapterId !== 'string') return null;
    if (input.topicModeId != null || subtopicIds.length > 0) return null;
    const chapter = await db.chapter.findFirst({
      where: { id: input.chapterId, isActive: true, gradeSubject: gradeEligibility },
      select: {
        id: true,
        title: true,
        pageStart: true,
        pageEnd: true,
        gradeSubjectId: true,
        gradeSubject: { select: { subject: { select: { id: true, name: true, color: true } } } },
      },
    });
    if (!chapter) return null;
    const topics = topicIds.length
      ? await db.topic.findMany({
          where: { id: { in: topicIds }, chapterId: chapter.id, isActive: true },
          select: { id: true, title: true, topicNo: true, chapterId: true },
          orderBy: { topicNo: 'asc' },
        })
      : [];
    if (topics.length !== topicIds.length) return null;
    if (input.pageStart != null && input.pageEnd != null) {
      if (chapter.pageStart === null || chapter.pageEnd === null) return null;
      if ((input.pageStart as number) < chapter.pageStart || (input.pageEnd as number) > chapter.pageEnd) return null;
    }
    return {
      subject: chapter.gradeSubject.subject,
      topic: topics.length ? [chapter.title, ...topics.map((item) => item.title)].join(' · ') : chapter.title,
      topicIds: topics.map((item) => item.id),
      subtopicIds: [] as string[],
      mode: 'BOOK' as const,
      chapterId: chapter.id,
      topicId: topics[0]?.id ?? null,
      topicModeId: null,
      pageStart: input.pageStart == null ? null : input.pageStart as number,
      pageEnd: input.pageEnd == null ? null : input.pageEnd as number,
    };
  }

  if (typeof input.topicModeId !== 'string') return null;
  if (input.chapterId != null || input.topicId != null || topicIds.length > 0 || input.pageStart != null || input.pageEnd != null) return null;
  const mode = await db.topicMode.findFirst({
    where: { id: input.topicModeId, isActive: true, gradeSubject: gradeEligibility },
    select: {
      id: true,
      title: true,
      gradeSubjectId: true,
      gradeSubject: { select: { subject: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!mode) return null;
  const subtopics = subtopicIds.length
    ? await db.topicModeSubtopic.findMany({
        where: { id: { in: subtopicIds }, topicModeId: mode.id, isActive: true },
        select: { id: true, title: true, subtopicNo: true },
        orderBy: { subtopicNo: 'asc' },
      })
    : [];
  if (subtopics.length !== subtopicIds.length) return null;
  return {
    subject: mode.gradeSubject.subject,
    topic: [mode.title, ...subtopics.map((item) => item.title)].join(' · '),
    topicIds: [] as string[],
    subtopicIds: subtopics.map((item) => item.id),
    mode: 'THEMATIC' as const,
    chapterId: null,
    topicId: null,
    topicModeId: mode.id,
    pageStart: null,
    pageEnd: null,
  };
}

export function isValidTaskPageRange(start: unknown, end: unknown) {
  const valid = (value: unknown) => value == null || (Number.isInteger(value) && (value as number) >= 1);
  const hasStart = start != null;
  const hasEnd = end != null;
  return valid(start) && valid(end) && hasStart === hasEnd && !(typeof start === 'number' && typeof end === 'number' && start > end);
}
