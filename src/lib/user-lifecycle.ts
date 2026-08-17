import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

export async function detachStudent(tx: Tx, studentId: string) {
  await tx.user.updateMany({ where: { id: studentId }, data: { assignedAdvisorId: null } });
  await tx.connectionRequest.updateMany({
    where: { studentId, status: { in: ['PENDING', 'ACCEPTED'] } },
    data: { status: 'ENDED', respondedAt: new Date() },
  });
}

export async function detachAdvisorRoster(tx: Tx, advisorId: string) {
  await tx.user.updateMany({ where: { assignedAdvisorId: advisorId }, data: { assignedAdvisorId: null } });
  await tx.connectionRequest.updateMany({
    where: { advisorId, status: { in: ['PENDING', 'ACCEPTED'] } },
    data: { status: 'ENDED', respondedAt: new Date() },
  });
}

export async function assignAdvisor(tx: Tx, studentId: string, advisorId: string | null) {
  const student = await tx.user.findFirst({
    where: { id: studentId, role: 'STUDENT', isActive: true, deletedAt: null },
    select: { id: true, instituteId: true, assignedAdvisorId: true },
  });
  if (!student) throw new Error('STUDENT_INVALID');
  if (advisorId === null) {
    await detachStudent(tx, studentId);
    return;
  }
  const advisor = await tx.user.findFirst({
    where: { id: advisorId, role: 'ADVISOR', isActive: true, deletedAt: null },
    select: { id: true, instituteId: true },
  });
  if (!advisor) throw new Error('ADVISOR_INVALID');
  if (student.instituteId !== advisor.instituteId) throw new Error('INSTITUTE_MISMATCH');

  await tx.connectionRequest.updateMany({
    where: { studentId, advisorId: { not: advisorId }, status: { in: ['PENDING', 'ACCEPTED'] } },
    data: { status: 'ENDED', respondedAt: new Date() },
  });
  await tx.user.update({ where: { id: studentId }, data: { assignedAdvisorId: advisorId } });
  await tx.connectionRequest.upsert({
    where: { studentId_advisorId: { studentId, advisorId } },
    create: { studentId, advisorId, initiatedBy: 'SUPER_ADMIN', status: 'ACCEPTED', respondedAt: new Date() },
    update: { status: 'ACCEPTED', respondedAt: new Date() },
  });
}
