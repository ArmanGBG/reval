import { create } from 'zustand';
import { ViewName, UserRole, User, Task, Flashcard, Ticket, MusicTrack, InstituteAdvisor, InstituteStudent, InstituteProfile, PlatformInstitute, GlobalUser, Exam, StudentProfile } from '@/lib/types';
import { MOCK_FLASHCARDS, MOCK_TICKETS, MOCK_TRACKS, MOCK_INSTITUTE_ADVISORS, MOCK_INSTITUTE_STUDENTS, MOCK_PLATFORM_INSTITUTES, MOCK_GLOBAL_USERS, MOCK_EXAMS } from '@/lib/constants/mockData';
import * as taskService from '@/lib/task-service';
import * as examService from '@/lib/exam-service';

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

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => void;

  // Tools
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;

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

  // ===== Daily Streak =====
  streakDays: number;
  streakLastDate: string | null;
  incrementStreak: () => void;

  // ===== Weekly Study Goal =====
  // The student's target study hours per Persian week (Sat–Fri).
  // Default is 20 hours. The history is computed dynamically from
  // `tasks` (no need to persist a separate history map).
  weeklyGoalHours: number;
  setWeeklyGoalHours: (hours: number) => void;
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
  userRole: 'STUDENT',
  setUserRole: (role) => {
    let defaultView: ViewName;
    if (role === 'STUDENT') defaultView = 'dashboard';
    else if (role === 'ADVISOR') defaultView = 'advisor-dashboard';
    else if (role === 'INSTITUTE_MANAGER') defaultView = 'institute-dashboard';
    else defaultView = 'sa-dashboard';
    set({ userRole: role, currentView: defaultView, selectedStudentId: null, selectedInstituteId: null, selectedGlobalUserId: null });
  },

  // Navigation
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),

  // Advisor: selected student
  selectedStudentId: null,
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),

  // Super Admin: selected institute / user
  selectedInstituteId: null,
  setSelectedInstituteId: (id) => set({ selectedInstituteId: id }),
  selectedGlobalUserId: null,
  setSelectedGlobalUserId: (id) => set({ selectedGlobalUserId: id }),

  // User
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  // Onboarding
  onboardingComplete: false,
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),

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

  // Flashcards
  flashcards: MOCK_FLASHCARDS,
  addFlashcard: (card) => set((state) => ({ flashcards: [...state.flashcards, card] })),
  updateFlashcard: (id, updates) =>
    set((state) => ({
      flashcards: state.flashcards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  // Tickets
  tickets: MOCK_TICKETS,
  addTicket: (ticket) => set((state) => ({ tickets: [...state.tickets, ticket] })),

  // Tools
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),

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

  // ===== Daily Streak =====
  streakDays: 0,
  streakLastDate: null,
  incrementStreak: () => {
    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const { streakLastDate, streakDays } = get();

    // Same day — already counted
    if (streakLastDate === today) return;

    // Check if today is the next consecutive day
    if (streakLastDate) {
      const lastDate = new Date(streakLastDate);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Next consecutive day — increment streak
        set({ streakDays: streakDays + 1, streakLastDate: today });
      } else {
        // Gap in days — reset to 1
        set({ streakDays: 1, streakLastDate: today });
      }
    } else {
      // First ever completion — start at 1
      set({ streakDays: 1, streakLastDate: today });
    }
  },

  // ===== Weekly Study Goal =====
  weeklyGoalHours: 20,
  setWeeklyGoalHours: (hours) => {
    // Clamp to a sensible range (10–40 hours) and round to integers.
    const clamped = Math.min(40, Math.max(10, Math.round(hours)));
    set({ weeklyGoalHours: clamped });
  },
}));
