import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper: parse activityTypes JSON string → array
function parseTask(task: Record<string, unknown>) {
  if (typeof task.activityTypes === 'string') {
    try {
      task.activityTypes = JSON.parse(task.activityTypes);
    } catch {
      task.activityTypes = [];
    }
  }
  return task;
}

// GET /api/tasks/[taskId] — Get a single task
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  const task = await db.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return NextResponse.json(
      { error: 'وظیفه یافت نشد' },
      { status: 404 }
    );
  }

  const parsed = parseTask({ ...task });
  return NextResponse.json({ task: parsed });
}

// PATCH /api/tasks/[taskId] — Update a task (partial update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    const body = await request.json();

    const allowed = [
      'subject',
      'subjectColor',
      'topic',
      'fieldType',
      'activityTypes',
      'targetTimeMinutes',
      'actualTimeMinutes',
      'targetTestCount',
      'actualTestCount',
      'completed',
      'date',
      'order',
      'createdBy',
      'createdById',
    ];

    const data: Record<string, unknown> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده' },
        { status: 400 }
      );
    }

    // If activityTypes is provided, serialize array to JSON string
    if (data.activityTypes !== undefined) {
      if (Array.isArray(data.activityTypes)) {
        data.activityTypes = JSON.stringify(data.activityTypes);
      } else if (typeof data.activityTypes === 'string') {
        // Already a string — validate it's valid JSON
        try {
          JSON.parse(data.activityTypes);
        } catch {
          return NextResponse.json(
            { error: 'activityTypes باید آرایه معتبر باشد' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'activityTypes باید آرایه باشد' },
          { status: 400 }
        );
      }
    }

    // Handle completed boolean — allow null for "pending" state
    if ('completed' in data) {
      if (data.completed === true || data.completed === false || data.completed === null) {
        // Valid value, keep as-is
      } else {
        return NextResponse.json(
          { error: 'completed باید true، false یا null باشد' },
          { status: 400 }
        );
      }
    }

    const task = await db.task.update({
      where: { id: taskId },
      data,
    });

    const parsed = parseTask({ ...task });
    return NextResponse.json({ task: parsed });
  } catch (error) {
    console.error('PATCH /api/tasks/[taskId] error:', error);
    // Prisma not-found error on update
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'وظیفه یافت نشد' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی وظیفه' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] — Delete a task
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  try {
    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[taskId] error:', error);
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'وظیفه یافت نشد' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'خطا در حذف وظیفه' },
      { status: 500 }
    );
  }
}
