import { create } from 'zustand';
import { ViewName, UserRole, User, Task, Flashcard, Ticket, MusicTrack, InstituteAdvisor, InstituteStudent, InstituteProfile, PlatformInstitute, GlobalUser, Exam } from '@/lib/types';
import { MOCK_TASKS, MOCK_FLASHCARDS, MOCK_TICKETS, MOCK_TRACKS, MOCK_INSTITUTE_ADVISORS, MOCK_INSTITUTE_STUDENTS, MOCK_PLATFORM_INSTITUTES, MOCK_GLOBAL_USERS, MOCK_EXAMS } from '@/lib/constants/mockData';

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

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  addTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  resetTask: (id: string) => void; // undo complete/skip
  reorderTasks: (tasks: Task[]) => void; // update order for multiple tasks

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
  exams: Exam[];
  addExam: (exam: Exam) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
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

  // Tasks
  tasks: MOCK_TASKS,
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  addTasks: (tasks) => set((state) => ({ tasks: [...state.tasks, ...tasks] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  resetTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, completed: null, actualTimeMinutes: null, actualTestCount: null }
          : t
      ),
    })),
  reorderTasks: (reorderedTasks) =>
    set((state) => {
      // Build a map of id -> new order
      const orderMap = new Map(reorderedTasks.map((t, i) => [t.id, i]));
      return {
        tasks: state.tasks.map((t) =>
          orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t
        ),
      };
    }),

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
  exams: MOCK_EXAMS,
  addExam: (exam) =>
    set((state) => ({ exams: [...state.exams, exam] })),
  updateExam: (id, updates) =>
    set((state) => ({
      exams: state.exams.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  deleteExam: (id) =>
    set((state) => ({ exams: state.exams.filter((e) => e.id !== id) })),
}));
