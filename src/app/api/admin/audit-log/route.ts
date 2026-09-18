import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// ===== GET /api/admin/audit-log =====
// Returns paginated audit log entries with optional filters:
//   ?entity=User        → filter by entity type
//   ?entityId=xxx       → filter by specific entity ID
//   ?actorId=xxx        → filter by who performed the action
//   ?limit=50 (default) → page size
//   ?offset=0 (default) → pagination offset
export async function GET(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;
  if (ctx.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const entity = params.get('entity');
  const entityId = params.get('entityId');
  const actorId = params.get('actorId');
  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
  const offset = parseInt(params.get('offset') || '0', 10);

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (actorId) where.actorId = actorId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      actorId: l.actorId,
      actorName: l.actor?.name ?? null,
      actorAvatar: l.actor?.avatar ?? null,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details ? JSON.parse(l.details) : null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
