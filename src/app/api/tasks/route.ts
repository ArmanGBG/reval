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

// GET /api/tasks?studentId=xxx&date=YYYY-MM-DD&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns tasks for a student, optionally filtered by date or date range
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!studentId) {
    return NextResponse.json(
      { error: 'studentId الزامی است' },
      { status: 400 }
    );
  }

  const where: Record<string, unknown> = { studentId };

  if (date) {
    where.date = date;
  } else if (startDate && endDate) {
    where.date = { gte: startDate, lte: endDate };
  } else if (startDate) {
    where.date = { gte: startDate };
  } else if (endDate) {
    where.date = { lte: endDate };
  }

  const tasks = await db.task.findMany({
    where,
    orderBy: { order: 'asc' },
  });

  const parsed = tasks.map((t) => parseTask({ ...t }));

  return NextResponse.json({ tasks: parsed });
}

// POST /api/tasks
// Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      subject,
      subjectColor,
      topic,
      fieldType,
      activityTypes,
      targetTimeMinutes,
      actualTimeMinutes,
      targetTestCount,
      actualTestCount,
      completed,
      date,
      order,
      createdBy,
      createdById,
    } = body;

    // Validate required fields
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json(
        { error: 'studentId الزامی است' },
        { status: 400 }
      );
    }
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'نام درس الزامی است' },
        { status: 400 }
      );
    }
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'مبحث الزامی است' },
        { status: 400 }
      );
    }
    if (!fieldType || typeof fieldType !== 'string') {
      return NextResponse.json(
        { error: 'نوع ارزیابی الزامی است' },
        { status: 400 }
      );
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'تاریخ الزامی است' },
        { status: 400 }
      );
    }
    if (!activityTypes || !Array.isArray(activityTypes)) {
      return NextResponse.json(
        { error: 'activityTypes باید آرایه باشد' },
        { status: 400 }
      );
    }
    if (typeof targetTimeMinutes !== 'number' || targetTimeMinutes < 0) {
      return NextResponse.json(
        { error: 'targetTimeMinutes الزامی و باید عدد غیرمنفی باشد' },
        { status: 400 }
      );
    }
    if (typeof targetTestCount !== 'number' || targetTestCount < 0) {
      return NextResponse.json(
        { error: 'targetTestCount الزامی و باید عدد غیرمنفی باشد' },
        { status: 400 }
      );
    }

    // Serialize activityTypes array to JSON string for storage
    const activityTypesStr = JSON.stringify(activityTypes);

    const task = await db.task.create({
      data: {
        studentId,
        subject,
        subjectColor: subjectColor || '#3EB489',
        topic,
        fieldType,
        activityTypes: activityTypesStr,
        targetTimeMinutes,
        actualTimeMinutes:
          typeof actualTimeMinutes === 'number' ? actualTimeMinutes : null,
        targetTestCount,
        actualTestCount:
          typeof actualTestCount === 'number' ? actualTestCount : null,
        completed:
          completed === true ? true : completed === false ? false : null,
        date,
        order: typeof order === 'number' ? order : 0,
        createdBy: createdBy || 'student',
        createdById: createdById || null,
      },
    });

    const parsed = parseTask({ ...task });

    return NextResponse.json({ task: parsed }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد وظیفه' },
      { status: 500 }
    );
  }
}
