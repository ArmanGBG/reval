import { describe, expect, it } from 'vitest';
import { decodeNavigationState, getRoleRootView, navigationUrl } from '@/lib/navigation';

describe('authenticated navigation', () => {
  it('uses the correct root view for each requested panel', () => {
    expect(getRoleRootView('STUDENT')).toBe('dashboard');
    expect(getRoleRootView('ADVISOR')).toBe('advisor-dashboard');
    expect(getRoleRootView('SUPER_ADMIN')).toBe('sa-dashboard');
  });

  it('rejects views that do not belong to the authenticated role', () => {
    expect(decodeNavigationState({ search: '?view=sa-users' }, 'STUDENT')).toEqual({
      view: 'dashboard',
      currentTool: null,
    });
  });

  it('restores advisor and super-admin detail identifiers', () => {
    expect(decodeNavigationState({ search: '?view=advisor-student-detail&student=student-1' }, 'ADVISOR')).toEqual({
      view: 'advisor-student-detail',
      selectedStudentId: 'student-1',
    });
    expect(decodeNavigationState({ search: '?view=sa-user-detail&user=user-1' }, 'SUPER_ADMIN')).toEqual({
      view: 'sa-user-detail',
      selectedGlobalUserId: 'user-1',
    });
  });

  it('falls back to list pages when a detail identifier is missing', () => {
    expect(decodeNavigationState({ search: '?view=advisor-student-detail' }, 'ADVISOR')).toEqual({
      view: 'advisor-students',
    });
    expect(decodeNavigationState({ search: '?view=sa-institute-detail' }, 'SUPER_ADMIN')).toEqual({
      view: 'sa-institutes',
    });
  });

  it('encodes a unique URL for section and detail navigation', () => {
    expect(navigationUrl({ view: 'plan' }, '/')).toBe('/?view=plan');
    expect(navigationUrl({ view: 'sa-institute-detail', selectedInstituteId: 'inst 1' }, '/')).toBe(
      '/?view=sa-institute-detail&institute=inst+1',
    );
  });
});
