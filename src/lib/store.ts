import { create } from 'zustand';
import { ViewName, UserRole, User, Task, Flashcard, Ticket, InstituteAdvisor, InstituteStudent, InstituteProfile, PlatformInstitute, GlobalUser, GlobalUserRole, Exam, StudentProfile, Notification, NotificationType } from '@/lib/types';
import * as taskService from '@/lib/task-service';
import * as examService from '@/lib/exam-service';
import * as messageService from '@/lib/message-service';
import { initSRSFields } from '@/lib/spaced-repetition';
import { AuthError } from '@/lib/api-client';

// ====================================================================
// Flashcards persistence (localStorage)
// -------------------------------------
// The student's review history (SM-2 scheduling state, due dates, ease
// factors) is precious — losing it on refresh would reset their entire
// spaced-repetition schedule. We persist the flashcards array to
// localStorage under a versioned key and hydrate it on store creation.
// ====================================================================

const FLASHCARDS_STORAGE_KEY = 'reval:flashcards:v2';
let taskLoadRequestSequence = 0;

function loadFlashcardsFromStorage(): Flashcard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Flashcard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFlashcardsToStorage(cards: Flashcard[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Quota exceeded or serialization error — fail silently.
    // The in-memory state is still correct.
  }
}

// ====================================================================
// Streak persistence (localStorage)
// ---------------------------------
// The student's streak (days, last active date, freezes, best) is precious
// and was previously lost on page refresh. We persist it to localStorage
// under a versioned key and hydrate it on store creation.
// ====================================================================

const STREAK_STORAGE_KEY = 'reval:streak:v1';

interface PersistedStreak {
  streakDays: number;
  streakLastDate: string | null;
  streakFreezes: number;
  streakBest: number;
}

function loadStreakFromStorage(): PersistedStreak {
  const defaults: PersistedStreak = {
    streakDays: 0,
    streakLastDate: null,
    streakFreezes: 1,
    streakBest: 0,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedStreak>;
    return {
      streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : 0,
      streakLastDate: typeof parsed.streakLastDate === 'string' ? parsed.streakLastDate : null,
      streakFreezes: typeof parsed.streakFreezes === 'number' ? parsed.streakFreezes : 1,
      streakBest: typeof parsed.streakBest === 'number' ? parsed.streakBest : 0,
    };
  } catch {
    return defaults;
  }
}

function saveStreakToStorage(s: PersistedStreak) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Quota exceeded — fail silently.
  }
}

// ====================================================================
// Auth persistence (localStorage)
// -------------------------------
// On page refresh the Zustand store resets to its initial values, so the
// user sees the login page even though their session cookie is still valid.
// We persist the minimal auth state (userRole, user, onboardingComplete) to
// localStorage and hydrate on store creation. The session cookie remains the
// source of truth for API calls — localStorage is only for UI hydration.
// ====================================================================

const AUTH_STORAGE_KEY = 'reval:auth:v1';

interface PersistedAuth {
  userRole: UserRole;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'grade' | 'major' | 'phone' | 'assignedAdvisorId'> | null;
  onboardingComplete: boolean;
}

function loadAuthFromStorage(): PersistedAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    // Basic shape validation
    if (!parsed || typeof parsed.userRole !== 'string' || typeof parsed.onboardingComplete !== 'boolean') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthToStorage(state: PersistedAuth) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — fail silently.
  }
}

function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // fail silently
  }
}

/**
 * Exported helper: read persisted auth from localStorage.
 * Used by page.tsx to hydrate the store before first render.
 */
export { loadAuthFromStorage, clearAuthStorage, AUTH_STORAGE_KEY };

interface AppState {
  // ===== Role-Based Access Control =====
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Navigation
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;

  // Advisor: selected student for detail view
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;

  // Super Admin: selected institute / user for detail view
  selectedInstituteId: string | null;
  setSelectedInstituteId: (id: string | null) => void;
  selectedGlobalUserId: string | null;
  setSelectedGlobalUserId: (id: string | null) => void;

  // User (Student profile)
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Logout — clears auth localStorage + resets store to unauthenticated state
  logout: () => void;

  // Hydrate auth from localStorage (called on page mount)
  hydrateAuth: () => void;

  // ===== Tasks (API-backed cache) =====
  // tasks is a cache of the currently-loaded student's tasks.
  // loadedStudentId tracks whose tasks are in the cache.
  // For a student, this is their own tasks. For an advisor viewing a student,
  // this is that student's tasks.
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  loadedStudentId: string | null;

  // Load tasks for a student from the API. Replaces the cache.
  loadTasksForStudent: (studentId: string, opts?: { date?: string; startDate?: string; endDate?: string }) => Promise<void>;

  // Create a task via API. Optimistically adds to cache (using the provided
  // task.id as a temp marker), then replaces with the real DB task on success.
  addTask: (task: Task) => Promise<void>;

  // Create multiple tasks via batch API.
  addTasks: (tasks: Task[]) => Promise<void>;

  // Update a task. Optimistic + API call + revert on error.
  updateTask: (id: string, updates: taskService.UpdateTaskPayload) => Promise<void>;

  // Delete a task. Optimistic + API call + revert on error.
  deleteTask: (id: string) => Promise<void>;

  // Reset a task (undo complete/skip). Delegates to updateTask.
  resetTask: (id: string) => Promise<void>;

  // Reorder tasks. Optimistic + batch API call.
  reorderTasks: (tasks: Task[]) => Promise<void>;

  // ===== Advisor: real students from DB =====
  // Fetched from /api/students?advisorId=... on login or dashboard mount.
  // These are real DB users — their IDs are used for task FK links.
  advisorStudents: StudentProfile[];
  advisorStudentsLoading: boolean;
  loadAdvisorStudents: (advisorId: string) => Promise<void>;

  // Selected Date
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Flashcards
  flashcards: Flashcard[];
  addFlashcard: (card: Flashcard) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  // Apply an SM-2 review to a card. `updates` should come from
  // scheduleNextReview() — this is a thin wrapper that also triggers
  // localStorage persistence.
  reviewFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  // Reset all SRS state (used by the "reset progress" button).
  resetFlashcardSRS: (id: string) => void;

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;

  // Tools
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;

  // Focus Mode — distraction-free study mode (hides nav + chrome)
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;
  toggleFocusMode: () => void;

  // ===== Institute Manager State =====
  instituteProfile: InstituteProfile;
  setInstituteProfile: (profile: Partial<InstituteProfile>) => void;

  instituteAdvisors: InstituteAdvisor[];
  addInstituteAdvisor: (advisor: InstituteAdvisor) => void;
  updateInstituteAdvisor: (id: string, updates: Partial<InstituteAdvisor>) => void;

  instituteStudents: InstituteStudent[];
  addInstituteStudent: (student: InstituteStudent) => void;
  updateInstituteStudent: (id: string, updates: Partial<InstituteStudent>) => void;
  assignStudentToAdvisor: (studentId: string, advisorId: string | null) => void;

  // ===== Super Admin State =====
  platformInstitutes: PlatformInstitute[];
  loadPlatformInstitutes: () => Promise<void>;
  addPlatformInstitute: (institute: Omit<PlatformInstitute, 'id' | 'createdAt' | 'studentCount' | 'advisorCount' | 'avgCompletionRate'>) => Promise<void>;
  updatePlatformInstitute: (id: string, updates: Partial<PlatformInstitute>) => Promise<void>;
  deletePlatformInstitute: (id: string) => Promise<void>;

  globalUsers: GlobalUser[];
  loadGlobalUsers: () => Promise<void>;
  createGlobalUser: (input: { name: string; phone: string; role: Exclude<GlobalUserRole, 'institute_manager'>; instituteId?: string | null; grade?: string; major?: string }) => Promise<void>;
  updateGlobalUser: (id: string, updates: { status?: 'active' | 'suspended'; name?: string; role?: 'student' | 'advisor'; instituteId?: string | null; grade?: string; major?: string }) => Promise<void>;
  assignGlobalStudentAdvisor: (studentId: string, advisorId: string | null) => Promise<void>;
  deleteGlobalUser: (id: string) => Promise<void>;

  // ===== Exams State =====
  // exams is a cache of exams visible to the current user.
  // For advisors: exams they created. For students: exams they're in.
  exams: Exam[];
  examsLoading: boolean;
  examsError: string | null;
  /** Loads exams from the API. Replaces the cache. */
  loadExams: (opts?: { advisorId?: string; studentId?: string }) => Promise<void>;
  /** Creates a new exam via the API. Adds to cache on success. */
  addExam: (input: examService.CreateExamInput) => Promise<Exam>;
  /** Updates an exam via the API. Updates cache on success. */
  updateExam: (id: string, updates: Partial<examService.CreateExamInput & { status: Exam['status'] }>) => Promise<void>;
  /** Deletes an exam via the API. Removes from cache on success. */
  deleteExam: (id: string) => Promise<void>;
  /** Saves exam results (bulk upsert). Updates cache + marks exam completed. */
  saveExamResults: (examId: string, results: Array<{ studentId: string; score?: number | null; rank?: number | null }>) => Promise<void>;

  // ===== Daily Streak =====
  streakDays: number;
  streakLastDate: string | null;
  // Streak freeze power-up: a "saved" day that prevents the streak from
  // resetting when the student misses a day. Each freeze covers one missed
  // day. Default: 1. Earned at every 7-day milestone (7, 14, 21, ...).
  // Capped at 3.
  streakFreezes: number;
  // Maximum days the student has ever reached (for the "personal best" badge).
  streakBest: number;
  incrementStreak: () => void;

  // ===== Notifications =====
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => void;
}

// Build a StudentProfile from a real DB student row (from /api/students).
// Rich profile fields (mood, scores, etc.) default to neutral values since
// they're not stored in the DB — they'll be computed from task data in the
// future. For now the advisor sees real student identity + tasks.
// NOTE: grade/major may be null if the student's profile is incomplete —
// the advisor TaskModal blocks task creation in that case.
function buildStudentProfile(row: {
  id: string;
  name: string;
  avatar: string;
  grade: string | null;
  major: string | null;
  reportSummary?: {
    studyHoursThisWeek: number;
    taskCompletionRate: number;
    incompleteCount: number;
  };
}): StudentProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar || '🧑‍🎓',
    grade: (row.grade || '') as StudentProfile['grade'],
    major: (row.major || '') as StudentProfile['major'],
    studyHoursPerWeek: row.reportSummary?.studyHoursThisWeek ?? 0,
    studyHoursTrend: 'stable',
    mockExamScore: 0,
    previousMockScore: 0,
    konkurPercentile: 0,
    schoolGrades: {},
    attendanceRate: 0,
    taskCompletionRate: row.reportSummary?.taskCompletionRate ?? 0,
    pomodoroSessionsPerWeek: 0,
    flashcardsMastered: 0,
    flashcardsTotal: 0,
    mood: 'good',
    motivationLevel: 5,
    stressLevel: 5,
    advisorNotes: '',
    lastSessionDate: '',
    weeksUntilExam: 0,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // ===== Role-Based Access Control =====
  // Hydrate userRole from localStorage if available, otherwise default
  userRole: (() => {
    if (typeof window !== 'undefined') {
      const auth = loadAuthFromStorage();
      if (auth) return auth.userRole;
    }
    return 'STUDENT' as UserRole;
  })(),
  setUserRole: (role) => {
    let defaultView: ViewName;
    if (role === 'STUDENT') defaultView = 'dashboard';
    else if (role === 'ADVISOR') defaultView = 'advisor-dashboard';
    else if (role === 'INSTITUTE_MANAGER') defaultView = 'institute-dashboard';
    else defaultView = 'sa-dashboard';
    set({ userRole: role, currentView: defaultView, selectedStudentId: null, selectedInstituteId: null, selectedGlobalUserId: null });
    // Persist auth after role change
    const { user, onboardingComplete } = get();
    saveAuthToStorage({ userRole: role, user, onboardingComplete });
  },

  // Navigation
  // Hydrate currentView from localStorage auth if available
  currentView: (() => {
    if (typeof window !== 'undefined') {
      const auth = loadAuthFromStorage();
      if (auth && auth.onboardingComplete) {
        if (auth.userRole === 'STUDENT') return 'dashboard' as ViewName;
        if (auth.userRole === 'ADVISOR') return 'advisor-dashboard' as ViewName;
        if (auth.userRole === 'INSTITUTE_MANAGER') return 'institute-dashboard' as ViewName;
        if (auth.userRole === 'SUPER_ADMIN') return 'sa-dashboard' as ViewName;
      }
    }
    return 'landing' as ViewName;
  })(),
  setCurrentView: (view) => set({ currentView: view }),

  // Advisor: selected student
  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),

  // Super Admin: selected institute / user
  selectedInstituteId: null,
  setSelectedInstituteId: (id) => set({ selectedInstituteId: id }),
  selectedGlobalUserId: null,
  setSelectedGlobalUserId: (id) => set({ selectedGlobalUserId: id }),

  // User — hydrate from localStorage if available
  user: (() => {
    if (typeof window !== 'undefined') {
      const auth = loadAuthFromStorage();
      if (auth && auth.user) return auth.user as User;
    }
    return null;
  })(),
  setUser: (user) => {
    set({ user });
    // Persist auth after user change
    const { userRole, onboardingComplete } = get();
    saveAuthToStorage({ userRole, user, onboardingComplete });
  },
  updateUser: (updates) =>
    set((state) => {
      const user = state.user ? { ...state.user, ...updates } : null;
      // Persist after update
      if (user) {
        saveAuthToStorage({ userRole: state.userRole, user, onboardingComplete: state.onboardingComplete });
      }
      return { user };
    }),

  // Onboarding — hydrate from localStorage if available
  onboardingComplete: (() => {
    if (typeof window !== 'undefined') {
      const auth = loadAuthFromStorage();
      if (auth) return auth.onboardingComplete;
    }
    return false;
  })(),
  setOnboardingComplete: (complete) => {
    set({ onboardingComplete: complete });
    // Persist auth after onboarding change
    const { userRole, user } = get();
    saveAuthToStorage({ userRole, user, onboardingComplete: complete });
  },

  // Logout — clear localStorage auth and reset store to unauthenticated state
  logout: () => {
    clearAuthStorage();
    set({
      userRole: 'STUDENT',
      user: null,
      onboardingComplete: false,
      currentView: 'landing',
      selectedStudentId: null,
      selectedInstituteId: null,
      selectedGlobalUserId: null,
      tasks: [],
      loadedStudentId: null,
      advisorStudents: [],
    });
  },

  // Hydrate auth from localStorage — called on page mount
  hydrateAuth: () => {
    const auth = loadAuthFromStorage();
    if (!auth) return;
    // Compute the default view for the persisted role
    let defaultView: ViewName;
    if (auth.userRole === 'STUDENT') defaultView = 'dashboard';
    else if (auth.userRole === 'ADVISOR') defaultView = 'advisor-dashboard';
    else if (auth.userRole === 'INSTITUTE_MANAGER') defaultView = 'institute-dashboard';
    else defaultView = 'sa-dashboard';
    set({
      userRole: auth.userRole,
      user: auth.user as User | null,
      onboardingComplete: auth.onboardingComplete,
      currentView: auth.onboardingComplete ? defaultView : 'landing',
    });
  },

  // ===== Tasks (API-backed) =====
  tasks: [],
  tasksLoading: false,
  tasksError: null,
  loadedStudentId: null,

  loadTasksForStudent: async (studentId, opts) => {
    const requestSequence = ++taskLoadRequestSequence;
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await taskService.loadTasks({ studentId, ...opts });
      if (requestSequence !== taskLoadRequestSequence) return;
      set({ tasks, loadedStudentId: studentId, tasksLoading: false });
    } catch (err) {
      if (requestSequence !== taskLoadRequestSequence) return;
      const msg = err instanceof Error ? err.message : 'خطا در بارگذاری وظایف';
      set({ tasksLoading: false, tasksError: msg });
    }
  },

  addTask: async (task) => {
    // Optimistic: add to cache with the client-provided temp id
    set((state) => ({ tasks: [...state.tasks, task] }));

    // Build the API payload (strip the temp id — DB generates the real one)
    const payload: taskService.CreateTaskPayload = {
      studentId: task.studentId,
      subjectId: task.subjectId!,
      topic: task.topic,
      fieldType: task.fieldType,
      activityTypes: task.activityTypes,
      targetTimeMinutes: task.targetTimeMinutes,
      actualTimeMinutes: task.actualTimeMinutes,
      targetTestCount: task.targetTestCount,
      actualTestCount: task.actualTestCount,
      status: task.status,
      completed: task.completed,
      detailsCompleted: task.detailsCompleted ?? false,
      date: task.date,
      order: task.order,
      createdBy: task.createdBy,
      createdById: task.createdById ?? null,
      chapterId: task.chapterId ?? null,
      topicId: task.topicId ?? null,
      topicIds: task.topicIds ?? [],
      topicModeId: task.topicModeId ?? null,
      curriculumMode: task.curriculumMode ?? null,
      topicModeSubtopicIds: task.topicModeSubtopicIds ?? [],
      pageStart: task.pageStart ?? null,
      pageEnd: task.pageEnd ?? null,
      teacherClassName: task.teacherClassName ?? null,
      sessionNumber: task.sessionNumber ?? null,
      bookName: task.bookName ?? null,
      testDescription: task.testDescription ?? null,
    };

    try {
      const realTask = await taskService.createTask(payload);
      // Replace the temp task with the real DB task (match by temp id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? realTask : t)),
      }));
    } catch (err) {
      // Remove the optimistic task on error
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== task.id) }));
      // Preserve AuthError type so callers can suppress duplicate toasts
      if (err instanceof AuthError) throw err;
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد وظیفه';
      throw new Error(msg);
    }
  },

  addTasks: async (newTasks) => {
    // Optimistic: add all to cache with temp ids
    set((state) => ({ tasks: [...state.tasks, ...newTasks] }));

    const payloads: taskService.CreateTaskPayload[] = newTasks.map((task) => ({
      studentId: task.studentId,
      subjectId: task.subjectId!,
      topic: task.topic,
      fieldType: task.fieldType,
      activityTypes: task.activityTypes,
      targetTimeMinutes: task.targetTimeMinutes,
      actualTimeMinutes: task.actualTimeMinutes,
      targetTestCount: task.targetTestCount,
      actualTestCount: task.actualTestCount,
      status: task.status,
      completed: task.completed,
      detailsCompleted: task.detailsCompleted ?? false,
      date: task.date,
      order: task.order,
      createdBy: task.createdBy,
      createdById: task.createdById ?? null,
      chapterId: task.chapterId ?? null,
      topicId: task.topicId ?? null,
      topicIds: task.topicIds ?? [],
      topicModeId: task.topicModeId ?? null,
      curriculumMode: task.curriculumMode ?? null,
      topicModeSubtopicIds: task.topicModeSubtopicIds ?? [],
      pageStart: task.pageStart ?? null,
      pageEnd: task.pageEnd ?? null,
      teacherClassName: task.teacherClassName ?? null,
      sessionNumber: task.sessionNumber ?? null,
      bookName: task.bookName ?? null,
      testDescription: task.testDescription ?? null,
    }));

    try {
      const realTasks = await taskService.createTasksBatch(payloads);
      // Replace temp tasks with real ones
      const tempIds = new Set(newTasks.map((t) => t.id));
      set((state) => ({
        tasks: [
          ...state.tasks.filter((t) => !tempIds.has(t.id)),
          ...realTasks,
        ],
      }));
    } catch (err) {
      // Remove optimistic tasks on error
      const tempIds = new Set(newTasks.map((t) => t.id));
      set((state) => ({
        tasks: state.tasks.filter((t) => !tempIds.has(t.id)),
      }));
      if (err instanceof AuthError) throw err;
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد وظایف';
      throw new Error(msg);
    }
  },

  updateTask: async (id, updates) => {
    // Save original for rollback
    const original = get().tasks.find((t) => t.id === id);

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));

    try {
      const realTask = await taskService.updateTask(id, updates);
      // Replace with the authoritative DB version
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? realTask : t)),
      }));
    } catch (err) {
      // Revert on error
      if (original) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? original : t)),
        }));
      }
      if (err instanceof AuthError) throw err;
      const msg = err instanceof Error ? err.message : 'خطا در به‌روزرسانی';
      throw new Error(msg);
    }
  },

  deleteTask: async (id) => {
    // Save original for rollback
    const original = get().tasks.find((t) => t.id === id);

    // Optimistic delete
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));

    try {
      await taskService.deleteTask(id);
    } catch (err) {
      // Re-add on error
      if (original) {
        set((state) => ({ tasks: [...state.tasks, original] }));
      }
      if (err instanceof AuthError) throw err;
      const msg = err instanceof Error ? err.message : 'خطا در حذف';
      throw new Error(msg);
    }
  },

  resetTask: async (id) => {
    await get().updateTask(id, {
      status: 'PENDING',
      completed: null,
      actualTimeMinutes: null,
      actualTestCount: null,
    });
  },

  reorderTasks: async (reorderedTasks) => {
    // Save original orders for rollback
    const originalOrders = new Map(
      get().tasks.map((t) => [t.id, t.order]),
    );

    // Build a map of id → new order
    const orderMap = new Map(reorderedTasks.map((t, i) => [t.id, i]));

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t,
      ),
    }));

    try {
      await taskService.reorderTasks(
        reorderedTasks.map((t, i) => ({ id: t.id, order: i })),
      );
    } catch (err) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          originalOrders.has(t.id)
            ? { ...t, order: originalOrders.get(t.id)! }
            : t,
        ),
      }));
      if (err instanceof AuthError) throw err;
      const msg = err instanceof Error ? err.message : 'خطا در مرتب‌سازی';
      throw new Error(msg);
    }
  },

  // ===== Advisor: real students from DB =====
  advisorStudents: [],
  advisorStudentsLoading: false,

  loadAdvisorStudents: async (advisorId) => {
    set({ advisorStudentsLoading: true });
    try {
      const res = await fetch(
        `/api/students?advisorId=${encodeURIComponent(advisorId)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در بارگذاری دانش‌آموزان');
      }
      const data = await res.json();
      const students = (Array.isArray(data.students) ? data.students : []).map(
        buildStudentProfile,
      );
      set({ advisorStudents: students, advisorStudentsLoading: false });
    } catch (err) {
      set({ advisorStudentsLoading: false });
      // Re-throw so the caller can handle
      throw err;
    }
  },

  // Selected Date
  selectedDate: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Flashcards — hydrate only user-created cards from localStorage.
  // Every card is guaranteed to have SRS fields (interval/repetition/easeFactor/dueDate).
  flashcards: (typeof window !== 'undefined'
    ? loadFlashcardsFromStorage().map((c) =>
        c.dueDate ? c : { ...c, ...initSRSFields() }
      )
    : []),
  addFlashcard: (card) =>
    set((state) => {
      // New cards start with fresh SRS state (due immediately).
      const newCard: Flashcard = { ...card, ...initSRSFields() };
      const next = [...state.flashcards, newCard];
      saveFlashcardsToStorage(next);
      return { flashcards: next };
    }),
  updateFlashcard: (id, updates) =>
    set((state) => {
      const next = state.flashcards.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      saveFlashcardsToStorage(next);
      return { flashcards: next };
    }),
  reviewFlashcard: (id, updates) =>
    set((state) => {
      const next = state.flashcards.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      saveFlashcardsToStorage(next);
      return { flashcards: next };
    }),
  resetFlashcardSRS: (id) =>
    set((state) => {
      const next = state.flashcards.map((c) =>
        c.id === id
          ? {
              ...c,
              ...initSRSFields(),
              mastery: 'review' as const,
              reviewCount: 0,
              lapseCount: 0,
            }
          : c
      );
      saveFlashcardsToStorage(next);
      return { flashcards: next };
    }),

  // Tickets
  tickets: [],
  addTicket: (ticket) => set((state) => ({ tickets: [...state.tickets, ticket] })),

  // Tools
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // Focus Mode
  focusMode: false,
  setFocusMode: (on) => set({ focusMode: on }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  // ===== Institute Manager State =====
  instituteProfile: {
    name: 'آموزشگاه هدف',
    logoUrl: null,
  },
  setInstituteProfile: (profile) =>
    set((state) => ({
      instituteProfile: { ...state.instituteProfile, ...profile },
    })),

  instituteAdvisors: [],
  addInstituteAdvisor: (advisor) =>
    set((state) => ({ instituteAdvisors: [...state.instituteAdvisors, advisor] })),
  updateInstituteAdvisor: (id, updates) =>
    set((state) => ({
      instituteAdvisors: state.instituteAdvisors.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  instituteStudents: [],
  addInstituteStudent: (student) =>
    set((state) => ({ instituteStudents: [...state.instituteStudents, student] })),
  updateInstituteStudent: (id, updates) =>
    set((state) => ({
      instituteStudents: state.instituteStudents.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  assignStudentToAdvisor: (studentId, advisorId) =>
    set((state) => ({
      instituteStudents: state.instituteStudents.map((s) =>
        s.id === studentId ? { ...s, assignedAdvisorId: advisorId } : s
      ),
    })),

  // ===== Super Admin State =====
  platformInstitutes: [],
  loadPlatformInstitutes: async () => {
    const res = await fetch('/api/admin/institutes');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'بارگذاری آموزشگاه‌ها ناموفق بود');
    set({ platformInstitutes: data.institutes });
  },
  addPlatformInstitute: async (institute) => {
    const res = await fetch('/api/admin/institutes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(institute) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ایجاد آموزشگاه ناموفق بود');
    set((state) => ({ platformInstitutes: [...state.platformInstitutes, data.institute] }));
  },
  updatePlatformInstitute: async (id, updates) => {
    const res = await fetch(`/api/admin/institutes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ویرایش آموزشگاه ناموفق بود');
    set((state) => ({ platformInstitutes: state.platformInstitutes.map((item) => item.id === id ? data.institute : item) }));
  },
  deletePlatformInstitute: async (id) => {
    const res = await fetch(`/api/admin/institutes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حذف آموزشگاه ناموفق بود');
    set((state) => ({
      platformInstitutes: state.platformInstitutes.filter((item) => item.id !== id),
      globalUsers: state.globalUsers.map((user) => user.instituteId === id ? { ...user, instituteId: null, instituteName: 'بدون آموزشگاه' } : user),
    }));
  },

  globalUsers: [],
  loadGlobalUsers: async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'بارگذاری کاربران ناموفق بود');
    set({ globalUsers: data.users });
  },
  createGlobalUser: async (input) => {
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ایجاد کاربر ناموفق بود');
    set((state) => ({ globalUsers: [...state.globalUsers, data.user] }));
  },
  updateGlobalUser: async (id, updates) => {
    const res = await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'ویرایش کاربر ناموفق بود');
    set((state) => ({ globalUsers: state.globalUsers.map((item) => item.id === id ? data.user : item) }));
  },
  assignGlobalStudentAdvisor: async (studentId, advisorId) => {
    const res = await fetch(`/api/users/${studentId}/advisor`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ advisorId }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'تخصیص مشاور ناموفق بود');
    set((state) => ({ globalUsers: state.globalUsers.map((item) => item.id === studentId ? { ...item, assignedAdvisorId: advisorId } : item) }));
  },
  deleteGlobalUser: async (id) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حذف کاربر ناموفق بود');
    set((state) => ({ globalUsers: state.globalUsers.filter((item) => item.id !== id) }));
  },

  // ===== Exams State =====
  exams: [],
  examsLoading: false,
  examsError: null,
  loadExams: async (opts) => {
    set({ examsLoading: true, examsError: null });
    try {
      const exams = await examService.loadExams(opts);
      set({ exams, examsLoading: false });
    } catch (e) {
      set({
        examsLoading: false,
        examsError: e instanceof Error ? e.message : 'خطا در بارگذاری آزمون‌ها',
      });
    }
  },
  addExam: async (input) => {
    const created = await examService.createExam(input);
    set((state) => ({ exams: [created, ...state.exams] }));
    return created;
  },
  updateExam: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      exams: state.exams.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    try {
      const updated = await examService.updateExam(id, updates);
      set((state) => ({
        exams: state.exams.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (e) {
      // Revert by reloading
      const exams = await examService.loadExams();
      set({ exams });
      throw e;
    }
  },
  deleteExam: async (id) => {
    // Optimistic remove
    const prev = get().exams;
    set((state) => ({ exams: state.exams.filter((e) => e.id !== id) }));
    try {
      await examService.deleteExam(id);
    } catch (e) {
      // Revert on error
      set({ exams: prev });
      throw e;
    }
  },
  saveExamResults: async (examId, results) => {
    // Optimistic update: immediately update the cached exam with the new
    // results + mark as completed so the UI feels instant.
    const prev = get().exams;
    set((state) => ({
      exams: state.exams.map((e) =>
        e.id === examId
          ? {
              ...e,
              results: results
                .filter((r) => r.score != null || r.rank != null)
                .map((r) => ({
                  studentId: r.studentId,
                  score: r.score ?? null,
                  rank: r.rank ?? null,
                })),
              status: 'completed' as const,
            }
          : e,
      ),
    }));
    try {
      const saved = await examService.saveExamResults(examId, results);
      set((state) => ({
        exams: state.exams.map((e) =>
          e.id === examId ? { ...e, results: saved, status: 'completed' as const } : e,
        ),
      }));
    } catch (e) {
      // Revert on error
      set({ exams: prev });
      throw e;
    }
  },

  // ===== Daily Streak (persisted to localStorage) =====
  ...loadStreakFromStorage(),
  incrementStreak: () => {
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const { streakLastDate, streakDays, streakFreezes, streakBest } = get();

    // Same day — already counted
    if (streakLastDate === today) return;

    // Helper: persist after every state change.
    const persist = (next: PersistedStreak) => {
      saveStreakToStorage(next);
    };

    // Helper: grant a freeze at every 7-day milestone (7, 14, 21, 28...).
    // Caps at 3 freezes total (so a long-time user doesn't accumulate 50).
    const grantMilestoneFreeze = (newStreak: number, freezes: number): number => {
      if (newStreak > 0 && newStreak % 7 === 0) {
        return Math.min(3, freezes + 1);
      }
      return freezes;
    };

    if (streakLastDate) {
      const lastDate = new Date(streakLastDate);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Next consecutive day — increment streak.
        const newStreak = streakDays + 1;
        const newFreezes = grantMilestoneFreeze(newStreak, streakFreezes);
        const next = {
          streakDays: newStreak,
          streakLastDate: today,
          streakFreezes: newFreezes,
          streakBest: Math.max(streakBest, newStreak),
        };
        set(next);
        persist(next);
      } else if (diffDays === 2 && streakFreezes > 0) {
        // Missed exactly 1 day AND have a freeze → consume freeze,
        // increment streak (the missed day is "frozen", today is the next day).
        const newStreak = streakDays + 1;
        const newFreezes = grantMilestoneFreeze(newStreak, streakFreezes - 1);
        const next = {
          streakDays: newStreak,
          streakLastDate: today,
          streakFreezes: newFreezes,
          streakBest: Math.max(streakBest, newStreak),
        };
        set(next);
        persist(next);
      } else {
        // Gap too large, or no freeze available — reset to 1.
        const next = {
          streakDays: 1,
          streakLastDate: today,
          streakFreezes: streakFreezes, // keep existing freezes
          streakBest: Math.max(streakBest, 1),
        };
        set(next);
        persist(next);
      }
    } else {
      // First ever completion — start at 1.
      const next = {
        streakDays: 1,
        streakLastDate: today,
        streakFreezes: streakFreezes,
        streakBest: Math.max(streakBest, 1),
      };
      set(next);
      persist(next);
    }
  },

  // ===== Notifications =====
  notifications: [],
  unreadNotificationCount: 0,
  markNotificationRead: (id) => {
    const target = get().notifications.find((notification) => notification.id === id);
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        notifications: updated,
        unreadNotificationCount: updated.filter((n) => !n.read).length,
      };
    });
    if (target?.messageId) {
      void messageService.markMessageRead(target.messageId);
    }
  },
  markAllNotificationsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      return {
        notifications: updated,
        unreadNotificationCount: 0,
      };
    });
    for (const n of get().notifications) {
      if (n.messageId) {
        void messageService.markMessageRead(n.messageId);
      }
    }
  },
  refreshNotifications: () => {
    const state = get();
    if (state.userRole === 'STUDENT' && state.onboardingComplete) {
      void messageService.loadInboxMessages().then((messages) => {
        const messageNotifications: Notification[] = messages.map((m) => {
          const senderLabel =
            m.senderName ||
            (m.senderRole === 'SUPER_ADMIN' ? 'سوپر ادمین' : 'مشاور');
          // Truncate body to ~120 chars for the bell preview
          const bodyPreview =
            m.body.length > 120 ? `${m.body.slice(0, 120)}…` : m.body;
          return {
            id: `message-${m.id}`,
            type: 'message' as NotificationType,
            title: m.title,
            description: bodyPreview,
            icon: 'Mail',
            color: 'var(--accent)',
            read: m.read,
            createdAt: new Date(m.createdAt).getTime(),
            messageId: m.id,
            senderName: senderLabel,
          };
        });
        messageNotifications.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.createdAt - a.createdAt;
        });
        set({
          notifications: messageNotifications,
          unreadNotificationCount: messageNotifications.filter((n) => !n.read).length,
        });
      }).catch(() => {
        set({ notifications: [], unreadNotificationCount: 0 });
      });
    } else {
      set({ notifications: [], unreadNotificationCount: 0 });
    }
  },
}));

if (typeof window !== 'undefined') {
  queueMicrotask(() => {
    const state = useAppStore.getState();
    if (state.onboardingComplete) {
      state.refreshNotifications();
    }
  });
}
