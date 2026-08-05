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

// POST /api/tasks/batch
// Create multiple tasks at once (for AI plan parser results)
// Body: { tasks: Task[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks باید آرایه‌ای غیرخالی باشد' },
        { status: 400 }
      );
    }

    // Validate each task has required fields
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.studentId || typeof t.studentId !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: studentId الزامی است` },
          { status: 400 }
        );
      }
      if (!t.subject || typeof t.subject !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: نام درس الزامی است` },
          { status: 400 }
        );
      }
      if (!t.topic || typeof t.topic !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: مبحث الزامی است` },
          { status: 400 }
        );
      }
      if (!t.fieldType || typeof t.fieldType !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: نوع ارزیابی الزامی است` },
          { status: 400 }
        );
      }
      if (!t.date || typeof t.date !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: تاریخ الزامی است` },
          { status: 400 }
        );
      }
      if (!Array.isArray(t.activityTypes)) {
        return NextResponse.json(
          { error: `tasks[${i}]: activityTypes باید آرایه باشد` },
          { status: 400 }
        );
      }
      if (typeof t.targetTimeMinutes !== 'number' || t.targetTimeMinutes < 0) {
        return NextResponse.json(
          { error: `tasks[${i}]: targetTimeMinutes الزامی و باید عدد غیرمنفی باشد` },
          { status: 400 }
        );
      }
      if (typeof t.targetTestCount !== 'number' || t.targetTestCount < 0) {
        return NextResponse.json(
          { error: `tasks[${i}]: targetTestCount الزامی و باید عدد غیرمنفی باشد` },
          { status: 400 }
        );
      }
    }

    // Create all tasks in a transaction
    const created = await db.$transaction(
      tasks.map((t: Record<string, unknown>) =>
        db.task.create({
          data: {
            studentId: t.studentId as string,
            subject: t.subject as string,
            subjectColor: (t.subjectColor as string) || '#3EB489',
            topic: t.topic as string,
            fieldType: t.fieldType as string,
            activityTypes: JSON.stringify(t.activityTypes),
            targetTimeMinutes: t.targetTimeMinutes as number,
            actualTimeMinutes:
              typeof t.actualTimeMinutes === 'number'
                ? t.actualTimeMinutes
                : null,
            targetTestCount: t.targetTestCount as number,
            actualTestCount:
              typeof t.actualTestCount === 'number'
                ? t.actualTestCount
                : null,
            completed:
              t.completed === true
                ? true
                : t.completed === false
                  ? false
                  : null,
            date: t.date as string,
            order: typeof t.order === 'number' ? t.order : 0,
            createdBy: (t.createdBy as string) || 'student',
            createdById: (t.createdById as string) || null,
          },
        })
      )
    );

    const parsed = created.map((t) => parseTask({ ...t }));

    return NextResponse.json({ tasks: parsed }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks/batch error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد دسته‌ای وظایف' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/batch
// Reorder multiple tasks at once
// Body: { tasks: { id: string, order: number }[] }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks باید آرایه‌ای غیرخالی باشد' },
        { status: 400 }
      );
    }

    // Validate structure
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.id || typeof t.id !== 'string') {
        return NextResponse.json(
          { error: `tasks[${i}]: id الزامی است` },
          { status: 400 }
        );
      }
      if (typeof t.order !== 'number') {
        return NextResponse.json(
          { error: `tasks[${i}]: order باید عدد باشد` },
          { status: 400 }
        );
      }
    }

    // Update all tasks in a transaction
    const updated = await db.$transaction(
      tasks.map(
        (t: { id: string; order: number }) =>
          db.task.update({
            where: { id: t.id },
            data: { order: t.order },
          })
      )
    );

    const parsed = updated.map((t) => parseTask({ ...t }));

    return NextResponse.json({ tasks: parsed });
  } catch (error) {
    console.error('PATCH /api/tasks/batch error:', error);
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'یکی از وظایف یافت نشد' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی دسته‌ای وظایف' },
      { status: 500 }
    );
  }
}
