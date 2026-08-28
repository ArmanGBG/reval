import type { UserRole, ViewName } from '@/lib/types';

export interface NavigationTarget {
  view: ViewName;
  selectedStudentId?: string | null;
  selectedInstituteId?: string | null;
  selectedGlobalUserId?: string | null;
  currentTool?: string | null;
}

export function getRoleRootView(role: UserRole): ViewName {
  if (role === 'ADVISOR') return 'advisor-dashboard';
  if (role === 'INSTITUTE_MANAGER') return 'institute-dashboard';
  if (role === 'SUPER_ADMIN') return 'sa-dashboard';
  return 'dashboard';
}

function isViewAllowedForRole(view: ViewName, role: UserRole): boolean {
  if (role === 'STUDENT') return ['dashboard', 'plan', 'exam-history', 'tools', 'analytics', 'settings'].includes(view);
  if (role === 'ADVISOR') return ['advisor-dashboard', 'advisor-students', 'advisor-student-detail', 'advisor-settings', 'advisor-messages'].includes(view);
  if (role === 'INSTITUTE_MANAGER') return ['institute-dashboard', 'institute-advisors', 'institute-students', 'institute-settings'].includes(view);
  return ['sa-dashboard', 'sa-subjects', 'sa-institutes', 'sa-institute-detail', 'sa-users', 'sa-user-detail', 'sa-settings', 'sa-messages'].includes(view);
}

export function decodeNavigationState(location: Pick<Location, 'search'>, role: UserRole): NavigationTarget {
  const params = new URLSearchParams(location.search);
  const requestedView = params.get('view') as ViewName | null;
  const view = requestedView && isViewAllowedForRole(requestedView, role)
    ? requestedView
    : getRoleRootView(role);

  if (view === 'advisor-student-detail') {
    const selectedStudentId = params.get('student');
    return selectedStudentId ? { view, selectedStudentId } : { view: 'advisor-students' };
  }
  if (view === 'sa-institute-detail') {
    const selectedInstituteId = params.get('institute');
    return selectedInstituteId ? { view, selectedInstituteId } : { view: 'sa-institutes' };
  }
  if (view === 'sa-user-detail') {
    const selectedGlobalUserId = params.get('user');
    return selectedGlobalUserId ? { view, selectedGlobalUserId } : { view: 'sa-users' };
  }

  return {
    view,
    currentTool: view === 'tools' ? params.get('tool') : null,
  };
}

export function navigationUrl(target: NavigationTarget, pathname = window.location.pathname): string {
  const params = new URLSearchParams({ view: target.view });
  if (target.selectedStudentId) params.set('student', target.selectedStudentId);
  if (target.selectedInstituteId) params.set('institute', target.selectedInstituteId);
  if (target.selectedGlobalUserId) params.set('user', target.selectedGlobalUserId);
  if (target.currentTool) params.set('tool', target.currentTool);
  return `${pathname}?${params.toString()}`;
}

export function pushNavigation(target: NavigationTarget): void {
  window.history.pushState({ revalView: target.view, revalEntry: true }, '', navigationUrl(target));
}

export function replaceNavigation(target: NavigationTarget): void {
  window.history.replaceState({ revalView: target.view, revalEntry: false }, '', navigationUrl(target));
}
