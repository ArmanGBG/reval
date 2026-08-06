import { create } from 'zustand';
import { ViewName, UserRole, User, Task, Flashcard, Ticket, MusicTrack, InstituteAdvisor, InstituteStudent, InstituteProfile, PlatformInstitute, GlobalUser, Exam, StudentProfile, Notification, NotificationType } from '@/lib/types';
import { MOCK_FLASHCARDS, MOCK_TICKETS, MOCK_TRACKS, MOCK_INSTITUTE_ADVISORS, MOCK_INSTITUTE_STUDENTS, MOCK_PLATFORM_INSTITUTES, MOCK_GLOBAL_USERS, MOCK_EXAMS } from '@/lib/constants/mockData';
import * as taskService from '@/lib/task-service';
import * as examService from '@/lib/exam-service';
import * as messageService from '@/lib/message-service';
import { initSRSFields } from '@/lib/spaced-repetition';

// ====================================================================
// Flashcards persistence (localStorage)
// -------------------------------------
// The student's review history (SM-2 scheduling state, due dates, ease
// factors) is precious — losing it on refresh would reset their entire
// spaced-repetition schedule. We persist the flashcards array to
// localStorage under a versioned key and hydrate it on store creation.
// ====================================================================

const FLASHCARDS_STORAGE_KEY = 'reval:flashcards:v1';

function loadFlashcardsFromStorage(): Flashcard[] {
  if (typeof window === 'undefined') return MOCK_FLASHCARDS;
  try {
    const raw = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!raw) return MOCK_FLASHCARDS;
    const parsed = JSON.parse(raw) as Flashcard[];
    if (!Array.isArray(parsed) || parsed.length === 0) return MOCK_FLASHCARDS;
    return parsed;
  } catch {
    return MOCK_FLASHCARDS;
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
// Notification read-state persistence (localStorage)
// -----------------------------------------------
// We persist only the set of read notification IDs so that the
// "unread" badge survives page refreshes. The notifications
// themselves are recomputed dynamically from current data.
// ====================================================================

const NOTIFICATIONS_STORAGE_KEY = 'reval:notifications:v1';

function loadReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (Array.isArray(parsed)) return new Set(parsed);
    return new Set();
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Quota exceeded — fail silently.
  }
}

// ====================================================================
// Notification computation
// -----------------------------------------------
// Builds the notification list from current store data (tasks, exams,
// streak, flashcards, weekly goal). Called by refreshNotifications().
// ====================================================================

function computeNotifications(data: {
  tasks: Task[];
  exams: Exam[];
  streakDays: number;
  streakLastDate: string | null;
  flashcards: Flashcard[];
  weeklyGoalHours: number;
  readIds: Set<string>;
}): Notification[] {
  const now = Date.now();
  const todayISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const notifications: Notification[] = [];

  // 1. Upcoming Exam (3 days or less)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysISO = (() => {
    const d = threeDaysFromNow;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  for (const exam of data.exams) {
    if (exam.status !== 'upcoming') continue;
    if (exam.date < todayISO || exam.date > threeDaysISO) continue;
    const examDate = new Date(exam.date);
    const todayDate = new Date(todayISO);
    const diffDays = Math.round((examDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) continue;
    notifications.push({
      id: `exam-${exam.id}`,
      type: 'upcoming-exam' as NotificationType,
      title: `آزمون ${exam.subject}`,
      description: diffDays === 0 ? 'امروز!' : `تا ${diffDays} روز دیگر`,
      icon: 'ClipboardCheck',
      color: diffDays <= 1 ? 'var(--danger)' : 'var(--warning)',
      read: data.readIds.has(`exam-${exam.id}`),
      createdAt: now - diffDays * 86400000,
    });
  }

  // 2. Task Reminder — incomplete tasks for today
  const todayIncompleteTasks = data.tasks.filter(
    (t) => t.date === todayISO && t.completed === null,
  );
  if (todayIncompleteTasks.length > 0) {
    notifications.push({
      id: 'task-reminder-today',
      type: 'task-reminder' as NotificationType,
      title: `${todayIncompleteTasks.length} تسک انجام‌نشده برای امروز`,
      description: 'به خودت فرصت بده و شروع کن!',
      icon: 'ListTodo',
      color: 'var(--accent)',
      read: data.readIds.has('task-reminder-today'),
      createdAt: now - 3600000, // 1 hour ago
    });
  }

  // 3. Streak Warning — streak > 2 and no tasks completed today
  const todayCompletedTasks = data.tasks.filter(
    (t) => t.date === todayISO && t.completed === true,
  );
  if (data.streakDays > 2 && todayCompletedTasks.length === 0 && data.streakLastDate !== todayISO) {
    notifications.push({
      id: 'streak-warning',
      type: 'streak-warning' as NotificationType,
      title: 'اگر امروز مطالعه نکنی، رکوردت از دست می‌ره!',
      description: `${data.streakDays} روز متوالی مطالعه`,
      icon: 'Flame',
      color: 'var(--danger)',
      read: data.readIds.has('streak-warning'),
      createdAt: now - 7200000, // 2 hours ago
    });
  }

  // 4. Streak Milestone — streak is a multiple of 7 and > 0
  if (data.streakDays > 0 && data.streakDays % 7 === 0) {
    notifications.push({
      id: `streak-milestone-${data.streakDays}`,
      type: 'streak-milestone' as NotificationType,
      title: `عالی! ${data.streakDays} روز متوالی مطالعه 🎉`,
      description: 'ادامه بده، بی‌نظیری!',
      icon: 'Trophy',
      color: 'var(--gold)',
      read: data.readIds.has(`streak-milestone-${data.streakDays}`),
      createdAt: now - 1800000, // 30 min ago
    });
  }

  // 5. Weekly Goal — compute hours studied this week
  // Persian week: Sat–Fri. Compute study hours for current week.
  const today = new Date();
  const persianWeekday = (() => {
    // Saturday=0, Sunday=1, ..., Friday=6
    const jsDay = today.getDay();
    return jsDay === 6 ? 0 : jsDay + 1;
  })();
  const saturdayOffset = persianWeekday;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - saturdayOffset);

  let weeklyMinutes = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    if (d > today) break;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayCompletedMinutes = data.tasks
      .filter((t) => t.date === iso && t.completed === true && t.actualTimeMinutes)
      .reduce((sum, t) => sum + (t.actualTimeMinutes || 0), 0);
    weeklyMinutes += dayCompletedMinutes;
  }
  const weeklyHours = weeklyMinutes / 60;
  const weeklyProgressPct = data.weeklyGoalHours > 0 ? (weeklyHours / data.weeklyGoalHours) * 100 : 100;

  if (weeklyProgressPct < 50 && data.weeklyGoalHours > 0) {
    const remaining = Math.max(0, data.weeklyGoalHours - weeklyHours);
    const remainingRounded = Math.round(remaining * 10) / 10;
    if (remainingRounded > 0) {
      notifications.push({
        id: 'weekly-goal-reminder',
        type: 'weekly-goal' as NotificationType,
        title: `هنوز ${remainingRounded} ساعت تا هدف هفتگیت فاصله داری`,
        description: `${Math.round(weeklyProgressPct)}٪ از هدف هفتگی`,
        icon: 'Target',
        color: 'var(--warning)',
        read: data.readIds.has('weekly-goal-reminder'),
        createdAt: now - 5400000, // 1.5 hours ago
      });
    }
  }

  // 6. Flashcard Review — due cards
  const dueCards = data.flashcards.filter((c) => {
    if (!c.dueDate) return true; // never reviewed = due
    return c.dueDate <= todayISO;
  });
  if (dueCards.length > 0) {
    notifications.push({
      id: 'flashcard-review',
      type: 'flashcard-review' as NotificationType,
      title: `${dueCards.length} فلش‌کارت برای مرور امروز آماده‌ان`,
      description: 'مرور منظم، یادگیری رو تثبیت می‌کنه',
      icon: 'Brain',
      color: 'var(--accent)',
      read: data.readIds.has('flashcard-review'),
      createdAt: now - 900000, // 15 min ago
    });
  }

  // Sort: unread first, then by createdAt (newest first)
  notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return notifications;
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
  user: Pick<User, 'id' | 'name' | 'avatar' | 'grade' | 'major' | 'goal' | 'dailyTargetHours' | 'phone' | 'assignedAdvisorId'> | null;
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
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;

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

  // Music
  tracks: MusicTrack[];
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  setCurrentTrack: (track: MusicTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;

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

  // Pomodoro
  pomodoroTime: number;
  pomodoroRunning: boolean;
  pomodoroMode: 'work' | 'break';
  setPomodoroTime: (time: number) => void;
  setPomodoroRunning: (running: boolean) => void;
  setPomodoroMode: (mode: 'work' | 'break') => void;
  resetPomodoro: () => void;

  // App Settings
  hapticFeedback: boolean;
  notificationReminders: boolean;
  setHapticFeedback: (val: boolean) => void;
  setNotificationReminders: (val: boolean) => void;

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
  addPlatformInstitute: (institute: PlatformInstitute) => void;
  updatePlatformInstitute: (id: string, updates: Partial<PlatformInstitute>) => void;

  globalUsers: GlobalUser[];
  updateGlobalUser: (id: string, updates: Partial<GlobalUser>) => void;

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

  // ===== Weekly Study Goal =====
  // The student's target study hours per Persian week (Sat–Fri).
  // Default is 20 hours. The history is computed dynamically from
  // `tasks` (no need to persist a separate history map).
  weeklyGoalHours: number;
  setWeeklyGoalHours: (hours: number) => void;

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
// NOTE: grade/major/goal may be null if the student's profile is incomplete —
// the advisor TaskModal blocks task creation in that case.
function buildStudentProfile(row: {
  id: string;
  name: string;
  avatar: string;
  grade: string | null;
  major: string | null;
  goal: string | null;
  dailyTargetHours: number;
}): StudentProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar || '🧑‍🎓',
    grade: (row.grade || '') as StudentProfile['grade'],
    major: (row.major || '') as StudentProfile['major'],
    goal: (row.goal || '') as StudentProfile['goal'],
    studyHoursPerWeek: 0,
    studyHoursTarget: row.dailyTargetHours * 7,
    studyHoursTrend: 'stable',
    mockExamScore: 0,
    previousMockScore: 0,
    konkurPercentile: 0,
    schoolGrades: {},
    attendanceRate: 0,
    taskCompletionRate: 0,
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
    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await taskService.loadTasks({ studentId, ...opts });
      set({ tasks, loadedStudentId: studentId, tasksLoading: false });
    } catch (err) {
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
      completed: task.completed,
      detailsCompleted: task.detailsCompleted ?? false,
      date: task.date,
      order: task.order,
      createdBy: task.createdBy,
      createdById: task.createdById ?? null,
      chapterId: task.chapterId ?? null,
      topicId: task.topicId ?? null,
      topicModeId: task.topicModeId ?? null,
      pageStart: task.pageStart ?? null,
      pageEnd: task.pageEnd ?? null,
    };

    try {
      const realTask = await taskService.createTask(payload);
      // Replace the temp task with the real DB task (match by temp id)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === task.id ? realTask : t)),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد وظیفه';
      // Remove the optimistic task on error
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== task.id) }));
      // Re-throw so the caller can show a toast
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
      completed: task.completed,
      detailsCompleted: task.detailsCompleted ?? false,
      date: task.date,
      order: task.order,
      createdBy: task.createdBy,
      createdById: task.createdById ?? null,
      chapterId: task.chapterId ?? null,
      topicId: task.topicId ?? null,
      topicModeId: task.topicModeId ?? null,
      pageStart: task.pageStart ?? null,
      pageEnd: task.pageEnd ?? null,
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
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد وظایف';
      // Remove optimistic tasks on error
      const tempIds = new Set(newTasks.map((t) => t.id));
      set((state) => ({
        tasks: state.tasks.filter((t) => !tempIds.has(t.id)),
      }));
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
      const msg = err instanceof Error ? err.message : 'خطا در به‌روزرسانی';
      // Revert on error
      if (original) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? original : t)),
        }));
      }
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
      const msg = err instanceof Error ? err.message : 'خطا در حذف';
      // Re-add on error
      if (original) {
        set((state) => ({ tasks: [...state.tasks, original] }));
      }
      throw new Error(msg);
    }
  },

  resetTask: async (id) => {
    await get().updateTask(id, {
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
      const msg = err instanceof Error ? err.message : 'خطا در مرتب‌سازی';
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          originalOrders.has(t.id)
            ? { ...t, order: originalOrders.get(t.id)! }
            : t,
        ),
      }));
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

  // Music
  tracks: MOCK_TRACKS,
  currentTrack: null,
  isPlaying: false,
  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: track !== null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // Flashcards — hydrate from localStorage if available, else MOCK_FLASHCARDS.
  // Every card is guaranteed to have SRS fields (interval/repetition/easeFactor/dueDate).
  flashcards: (typeof window !== 'undefined'
    ? loadFlashcardsFromStorage().map((c) =>
        c.dueDate ? c : { ...c, ...initSRSFields() }
      )
    : MOCK_FLASHCARDS),
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
  tickets: MOCK_TICKETS,
  addTicket: (ticket) => set((state) => ({ tickets: [...state.tickets, ticket] })),

  // Tools
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // Focus Mode
  focusMode: false,
  setFocusMode: (on) => set({ focusMode: on }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  // Pomodoro
  pomodoroTime: 25 * 60,
  pomodoroRunning: false,
  pomodoroMode: 'work',
  setPomodoroTime: (time) => set({ pomodoroTime: time }),
  setPomodoroRunning: (running) => set({ pomodoroRunning: running }),
  setPomodoroMode: (mode) => set({ pomodoroMode: mode }),
  resetPomodoro: () => set({ pomodoroTime: 25 * 60, pomodoroRunning: false, pomodoroMode: 'work' }),

  // App Settings
  hapticFeedback: true,
  notificationReminders: true,
  setHapticFeedback: (val) => set({ hapticFeedback: val }),
  setNotificationReminders: (val) => set({ notificationReminders: val }),

  // ===== Institute Manager State =====
  instituteProfile: {
    name: 'آموزشگاه هدف',
    logoUrl: null,
  },
  setInstituteProfile: (profile) =>
    set((state) => ({
      instituteProfile: { ...state.instituteProfile, ...profile },
    })),

  instituteAdvisors: MOCK_INSTITUTE_ADVISORS,
  addInstituteAdvisor: (advisor) =>
    set((state) => ({ instituteAdvisors: [...state.instituteAdvisors, advisor] })),
  updateInstituteAdvisor: (id, updates) =>
    set((state) => ({
      instituteAdvisors: state.instituteAdvisors.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  instituteStudents: MOCK_INSTITUTE_STUDENTS,
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
  platformInstitutes: MOCK_PLATFORM_INSTITUTES,
  addPlatformInstitute: (institute) =>
    set((state) => ({ platformInstitutes: [...state.platformInstitutes, institute] })),
  updatePlatformInstitute: (id, updates) =>
    set((state) => ({
      platformInstitutes: state.platformInstitutes.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  globalUsers: MOCK_GLOBAL_USERS,
  updateGlobalUser: (id, updates) =>
    set((state) => ({
      globalUsers: state.globalUsers.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),

  // ===== Exams State =====
  // Initialize with MOCK_EXAMS so the UI has something to show before the
  // first API load completes. loadExams() replaces these with real DB rows.
  exams: MOCK_EXAMS,
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

  // ===== Weekly Study Goal =====
  weeklyGoalHours: 20,
  setWeeklyGoalHours: (hours) => {
    // Clamp to a sensible range (10–40 hours) and round to integers.
    const clamped = Math.min(40, Math.max(10, Math.round(hours)));
    set({ weeklyGoalHours: clamped });
  },

  // ===== Notifications =====
  notifications: [],
  unreadNotificationCount: 0,
  markNotificationRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      const readIds = new Set(
        updated.filter((n) => n.read).map((n) => n.id),
      );
      saveReadNotificationIds(readIds);
      return {
        notifications: updated,
        unreadNotificationCount: updated.filter((n) => !n.read).length,
      };
    });
    // ===== DB-backed message persistence =====
    // If this notification links to a DB message (advisor/super-admin → student),
    // fire-and-forget a PATCH to persist the read state server-side.
    const target = get().notifications.find((n) => n.id === id);
    if (target?.messageId) {
      void messageService.markMessageRead(target.messageId);
    }
  },
  markAllNotificationsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      const readIds = new Set(updated.map((n) => n.id));
      saveReadNotificationIds(readIds);
      return {
        notifications: updated,
        unreadNotificationCount: 0,
      };
    });
    // ===== DB-backed message persistence (mark all message notifications read) =====
    for (const n of get().notifications) {
      if (n.messageId) {
        void messageService.markMessageRead(n.messageId);
      }
    }
  },
  refreshNotifications: () => {
    const state = get();
    const readIds = loadReadNotificationIds();
    const computed = computeNotifications({
      tasks: state.tasks,
      exams: state.exams,
      streakDays: state.streakDays,
      streakLastDate: state.streakLastDate,
      flashcards: state.flashcards,
      weeklyGoalHours: state.weeklyGoalHours,
      readIds,
    });

    // ===== Merge DB-backed messages for STUDENT role =====
    // For students, asynchronously fetch inbox messages (recipientId = me OR
    // broadcast) and merge them into the notifications array. Computed
    // notifications are shown immediately; DB messages are merged in once
    // the fetch resolves. This keeps the bell responsive while still showing
    // advisor/super-admin messages.
    if (state.userRole === 'STUDENT') {
      // Show computed notifications immediately
      const unreadNow = computed.filter((n) => !n.read).length;
      set({ notifications: computed, unreadNotificationCount: unreadNow });

      // Asynchronously merge DB messages
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

        // Merge: keep computed notifications that aren't message-*,
        // then add DB message notifications.
        const merged = [
          ...computed.filter((n) => !n.id.startsWith('message-')),
          ...messageNotifications,
        ];
        // Sort: unread first, then by createdAt DESC
        merged.sort((a, b) => {
          if (a.read !== b.read) return a.read ? 1 : -1;
          return b.createdAt - a.createdAt;
        });
        const mergedUnread = merged.filter((n) => !n.read).length;
        set({
          notifications: merged,
          unreadNotificationCount: mergedUnread,
        });
      }).catch(() => {
        // Network/API error — keep showing the computed notifications.
        // No-op; the bell still works for computed notifications.
      });
    } else {
      // Non-student roles — just show computed notifications
      const unreadNotificationCount = computed.filter((n) => !n.read).length;
      set({ notifications: computed, unreadNotificationCount });
    }
  },
}));

// ===== Initialize notifications on first client render =====
// We call refreshNotifications once on the client so that
// notifications are computed from the current store data.
if (typeof window !== 'undefined') {
  // Use queueMicrotask to defer until after the store is fully created,
  // so all state fields are accessible.
  queueMicrotask(() => {
    useAppStore.getState().refreshNotifications();
  });
}
