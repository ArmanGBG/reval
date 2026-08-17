import { describe, expect, it, vi } from 'vitest';
import { assignAdvisor, detachAdvisorRoster, detachStudent } from '@/lib/user-lifecycle';

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    connectionRequest: {
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    ...overrides,
  };
}

type LifecycleTx = Parameters<typeof assignAdvisor>[0];

describe('advisor assignment lifecycle', () => {
  it('clears student and advisor relationships idempotently', async () => {
    const tx = transaction();
    await detachStudent(tx as unknown as LifecycleTx, 'student-1');
    await detachAdvisorRoster(tx as unknown as LifecycleTx, 'advisor-1');
    expect(tx.user.updateMany).toHaveBeenCalledWith({ where: { id: 'student-1' }, data: { assignedAdvisorId: null } });
    expect(tx.user.updateMany).toHaveBeenCalledWith({ where: { assignedAdvisorId: 'advisor-1' }, data: { assignedAdvisorId: null } });
    expect(tx.connectionRequest.updateMany).toHaveBeenCalledTimes(2);
  });

  it('assigns active users from the same institute and ends older links', async () => {
    const tx = transaction();
    tx.user.findFirst
      .mockResolvedValueOnce({ id: 'student-1', instituteId: 'institute-1', assignedAdvisorId: null })
      .mockResolvedValueOnce({ id: 'advisor-1', instituteId: 'institute-1' });
    await assignAdvisor(tx as unknown as LifecycleTx, 'student-1', 'advisor-1');
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'student-1' }, data: { assignedAdvisorId: 'advisor-1' } });
    expect(tx.connectionRequest.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentId_advisorId: { studentId: 'student-1', advisorId: 'advisor-1' } },
    }));
  });

  it('rejects cross-institute assignment', async () => {
    const tx = transaction();
    tx.user.findFirst
      .mockResolvedValueOnce({ id: 'student-1', instituteId: 'institute-1', assignedAdvisorId: null })
      .mockResolvedValueOnce({ id: 'advisor-1', instituteId: 'institute-2' });
    await expect(assignAdvisor(tx as unknown as LifecycleTx, 'student-1', 'advisor-1')).rejects.toThrow('INSTITUTE_MISMATCH');
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
