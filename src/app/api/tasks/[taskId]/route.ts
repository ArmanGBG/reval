import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, canModifyTask, canDeleteTask, canEditAssignedStudentPlan, canViewStudentTasks, isTaskFieldType, validateTaskCurriculum } from '@/lib/api-auth';
import { isAdvisorMoveTaskPatch, isAdvisorPlanTaskPatch, isStudentAdvisorTaskPatch, isStudentClassDraftCompletionPatch, isTaskStatus, legacyTaskStatus, validateTaskLifecycle } from '@/lib/task-status';
import { parseTaskResponse, taskPatchData, taskTopicInclude } from '@/lib/task-api';
import { classSessionDetailsComplete, isClassActivityTypes } from '@/lib/class-task';

// GET /api/tasks/[taskId] — Get a single task
// Authorization: caller must be able to view the task's student (owner,
// assigned advisor, institute manager, or super admin).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { taskId } = await params;

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: taskTopicInclude,
  });

  if (!task) {
    return NextResponse.json({ error: 'وظیفه یافت نشد' }, { status: 404 });
  }

  // Ownership check
  const allowed = await canViewStudentTasks(ctx, task.studentId);
  if (!allowed) {
    return NextResponse.json(
      { error: 'دسترسی به این تسک مجاز نیست' },
      { status: 403 },
    );
  }

  const parsed = parseTaskResponse({ ...task });
  return NextResponse.json({ task: parsed });
}

// PATCH /api/tasks/[taskId] — Update a task (partial update)
// Accepts optional chapterId / topicId / topicModeId. When any of these are
// present in the body AND at least one is a non-empty string, the text fields
// (subject / subjectColor / topic) are auto-resolved from the linked entity.
//
// Authorization: caller must be able to modify the task (owner, assigned
// advisor, or super admin). createdBy and createdById are NOT updatable
// via PATCH (they're set at creation time and immutable).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { taskId } = await params;

  try {
    const body = await request.json();
    if ('advisorNote' in body && ctx.user.role !== 'ADVISOR') {
      return NextResponse.json({ error: 'فقط مشاور می‌تواند یادداشت تسک را تغییر دهد' }, { status: 403 });
    }
    const existing = await db.task.findUnique({ where: { id: taskId }, include: taskTopicInclude });
    if (!existing) return NextResponse.json({ error: 'وظیفه یافت نشد' }, { status: 404 });
    const canModify = await canModifyTask(ctx, taskId);
    const canEditAdvisorPlan = await canEditAssignedStudentPlan(ctx, existing.studentId);
    const isStudentLifecycleUpdate = ctx.user.role === 'STUDENT' && ctx.userId === existing.studentId && existing.createdBy === 'advisor';
    let existingActivityTypes: unknown = null;
    if (existing.activityTypes) {
      try {
        existingActivityTypes = JSON.parse(existing.activityTypes);
      } catch {
        existingActivityTypes = null;
      }
    }
    const isStudentClassDraftCompletion = isStudentLifecycleUpdate
      && (existing.status === 'DRAFT' || (existing.status === 'PENDING' && existing.detailsCompleted === false))
      && isClassActivityTypes(existingActivityTypes)
      && isStudentClassDraftCompletionPatch(body);
    if (!canModify && (!canEditAdvisorPlan || !isAdvisorPlanTaskPatch(body)) && (!isStudentClassDraftCompletion && (!isStudentLifecycleUpdate || !isStudentAdvisorTaskPatch(body)))) {
      return NextResponse.json({ error: 'دسترسی به این تسک مجاز نیست' }, { status: 403 });
    }
    if (!(await canViewStudentTasks(ctx, existing.studentId))) return NextResponse.json({ error: 'دسترسی به این تسک مجاز نیست' }, { status: 403 });
    if (ctx.user.role === 'ADVISOR') {
      const planPatch = isAdvisorPlanTaskPatch(body);
      const movePatch = isAdvisorMoveTaskPatch(body) && (existing.status === 'PENDING' || existing.status === 'INCOMPLETE');
      if (!planPatch && !movePatch) {
        return NextResponse.json({ error: 'مشاور فقط می‌تواند جزئیات برنامه را ویرایش کند و اجازه تغییر نتیجه ثبت‌شده را ندارد' }, { status: 403 });
      }
    }

    // createdBy and createdById are intentionally NOT in the allowed list —
    // they're immutable after creation to prevent spoofing.
    const allowed = [
      'subjectId',
      'fieldType',
      'activityTypes',
      'targetTimeMinutes',
      'actualTimeMinutes',
      'targetTestCount',
      'actualTestCount',
      'completed',
      'status',
      'detailsCompleted',
      'date',
      'order',
      'chapterId',
      'topicId',
      'topicModeId',
      'curriculumMode',
      'pageStart',
      'pageEnd',
      'teacherClassName',
      'sessionNumber',
      'bookName',
      'testDescription',
      'advisorNote',
    ];

    const data = taskPatchData(body, allowed);

    for (const field of ['teacherClassName', 'sessionNumber', 'bookName', 'testDescription', 'advisorNote'] as const) {
      if (field in body) {
        if (body[field] !== null && typeof body[field] !== 'string') {
          return NextResponse.json({ error: `${field} باید متن یا null باشد` }, { status: 400 });
        }
        data[field] = typeof body[field] === 'string' ? body[field].trim() || null : null;
      }
    }

    if (Object.keys(data).length === 0 && !('topicIds' in body) && !('topicModeSubtopicIds' in body)) {
      return NextResponse.json(
        { error: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده' },
        { status: 400 },
      );
    }

    let existingActivityTypesForCurriculum: unknown = null;
    if (existing.activityTypes) {
      try {
        existingActivityTypesForCurriculum = JSON.parse(existing.activityTypes);
      } catch {
        existingActivityTypesForCurriculum = null;
      }
    }
    const requestedActivityTypes = body.activityTypes !== undefined ? body.activityTypes : existingActivityTypesForCurriculum;
    const hasClassVideoRequested = isClassActivityTypes(requestedActivityTypes);
    if (hasClassVideoRequested) {
      const teacherClassName = 'teacherClassName' in body ? body.teacherClassName : existing.teacherClassName;
      const sessionNumber = 'sessionNumber' in body ? body.sessionNumber : existing.sessionNumber;
      const existingIsClassVideo = isClassActivityTypes(existingActivityTypesForCurriculum);
      const classDefinitionChanged = body.activityTypes !== undefined
        || 'teacherClassName' in body
        || 'sessionNumber' in body
        || 'subjectId' in body
        || 'fieldType' in body
        || 'curriculumMode' in body
        || 'chapterId' in body
        || 'topicId' in body
        || 'topicModeId' in body;
      if ((!existingIsClassVideo || classDefinitionChanged) && !classSessionDetailsComplete(teacherClassName, sessionNumber)) {
        return NextResponse.json({ error: 'نام کلاس و شماره جلسه برای کلاس/ویدیو الزامی است' }, { status: 400 });
      }
    }
    const fieldType = 'fieldType' in body ? body.fieldType : existing.fieldType;
    const subjectId = body.subjectId ?? existing.subjectId;
    if ((!isTaskFieldType(fieldType) && !(hasClassVideoRequested && fieldType == null)) || typeof subjectId !== 'string') return NextResponse.json({ error: 'subjectId یا fieldType معتبر نیست' }, { status: 400 });
    const curriculumMode = 'curriculumMode' in body ? body.curriculumMode : existing.curriculumMode;
    if (hasClassVideoRequested && curriculumMode != null && !isTaskFieldType(fieldType)) {
      return NextResponse.json({ error: 'برای اتصال کلاس به محتوای درسی، نوع ارزیابی الزامی است' }, { status: 400 });
    }
    const isBook = curriculumMode === 'BOOK';
    const isThematic = curriculumMode === 'THEMATIC';
    const chapterChanged = 'chapterId' in body && body.chapterId !== existing.chapterId;
    const topicIds = 'topicIds' in body
      ? body.topicIds
      : chapterChanged
        ? []
        : existing.topics.map((item) => item.topicId);
    const topicId = 'topicId' in body
      ? body.topicId
      : 'topicIds' in body
        ? Array.isArray(body.topicIds) ? body.topicIds[0] ?? null : null
        : chapterChanged
          ? null
          : existing.topicId;
    const curriculum = await validateTaskCurriculum({
      studentId: existing.studentId,
      subjectId,
      fieldType,
      curriculumMode,
      chapterId: 'chapterId' in body ? body.chapterId : isBook ? existing.chapterId : null,
      topicId: isBook ? topicId : null,
      topicIds: isBook ? topicIds : [],
      topicModeId: 'topicModeId' in body ? body.topicModeId : isThematic ? existing.topicModeId : null,
      topicModeSubtopicIds: 'topicModeSubtopicIds' in body ? body.topicModeSubtopicIds : isThematic ? existing.topicModeSubtopics.map((item) => item.topicModeSubtopicId) : [],
      pageStart: 'pageStart' in body ? body.pageStart : isBook ? existing.pageStart : null,
      pageEnd: 'pageEnd' in body ? body.pageEnd : isBook ? existing.pageEnd : null,
      allowSubjectOnly: hasClassVideoRequested,
      allowAllGrades: true,
    });
    if (!curriculum) return NextResponse.json({ error: 'ساختار برنامه درسی، پایه، رشته یا نوع ارزیابی معتبر نیست' }, { status: 400 });
    const detailsCompleted = body.detailsCompleted !== undefined ? body.detailsCompleted : existing.detailsCompleted;
    if (typeof detailsCompleted !== 'boolean') return NextResponse.json({ error: 'detailsCompleted باید boolean باشد' }, { status: 400 });
    existingActivityTypes = null;
    if (existing.activityTypes) {
      try {
        existingActivityTypes = JSON.parse(existing.activityTypes);
      } catch {
        existingActivityTypes = null;
      }
    }
    const activityTypes = body.activityTypes !== undefined ? body.activityTypes : existingActivityTypes;
    const targetTimeMinutes = body.targetTimeMinutes !== undefined ? body.targetTimeMinutes : existing.targetTimeMinutes;
    const targetTestCount = body.targetTestCount !== undefined ? body.targetTestCount : existing.targetTestCount;
    const status = body.status ?? (body.completed !== undefined
      ? body.completed === true ? 'COMPLETED' : body.completed === false ? 'SKIPPED' : hasClassVideoRequested ? 'PENDING' : legacyTaskStatus(detailsCompleted, null)
      : existing.status ?? legacyTaskStatus(detailsCompleted, existing.completed));
    if (!isTaskStatus(status)) return NextResponse.json({ error: 'status معتبر نیست' }, { status: 400 });
    const lifecycleError = validateTaskLifecycle(status, detailsCompleted, body.completed !== undefined ? body.completed : existing.completed, hasClassVideoRequested);
    if (lifecycleError) return NextResponse.json({ error: lifecycleError }, { status: 400 });
    const invalidClassMetrics = hasClassVideoRequested && (
      (targetTimeMinutes != null && (typeof targetTimeMinutes !== 'number' || targetTimeMinutes < 0))
      || (targetTestCount != null && (typeof targetTestCount !== 'number' || targetTestCount < 0))
    );
    const invalidStandardMetrics = !hasClassVideoRequested && status !== 'DRAFT' && (!Array.isArray(activityTypes) || activityTypes.length === 0 || typeof targetTimeMinutes !== 'number' || targetTimeMinutes < 0 || typeof targetTestCount !== 'number' || targetTestCount < 0);
    if (invalidClassMetrics || invalidStandardMetrics) {
      return NextResponse.json({ error: 'جزئیات تکمیل‌شده نیازمند فعالیت، زمان و تعداد تست معتبر است' }, { status: 400 });
    }
    if ((body.completed === true || body.completed === false) && !detailsCompleted && !hasClassVideoRequested) return NextResponse.json({ error: 'تسک ناقص قابل تکمیل یا رد کردن نیست' }, { status: 400 });
    if (status === 'COMPLETED') {
      if (body.actualTimeMinutes === undefined && existing.actualTimeMinutes === null) {
        data.actualTimeMinutes = typeof targetTimeMinutes === 'number' ? targetTimeMinutes : 0;
      }
      if (body.actualTestCount === undefined && existing.actualTestCount === null) {
        data.actualTestCount = typeof targetTestCount === 'number' ? targetTestCount : 0;
      }
    }
    data.subjectId = curriculum.subject.id;
    data.subject = curriculum.subject.name;
    data.subjectColor = curriculum.subject.color;
    data.topic = curriculum.topic;
    data.status = status;
    data.curriculumMode = curriculum.mode;
    data.chapterId = curriculum.chapterId;
    data.topicId = curriculum.topicId;
    data.topicModeId = curriculum.topicModeId;
    data.pageStart = curriculum.pageStart;
    data.pageEnd = curriculum.pageEnd;
    data.topics = { deleteMany: {}, create: curriculum.topicIds.map((topicId) => ({ topicId })) };
    data.topicModeSubtopics = { deleteMany: {}, create: curriculum.subtopicIds.map((topicModeSubtopicId) => ({ topicModeSubtopicId })) };
    const hasClassVideo = Array.isArray(activityTypes) && activityTypes.includes('کلاس/ویدیو');
    const hasTestDetails = Array.isArray(activityTypes) && (activityTypes.includes('تست آموزشی') || activityTypes.includes('تست سنجشی'));
    if (!hasClassVideo) {
      data.teacherClassName = null;
      data.sessionNumber = null;
    }
    if (!hasTestDetails) {
      data.bookName = null;
      data.testDescription = null;
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
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: 'activityTypes باید آرایه باشد' },
          { status: 400 },
        );
      }
    }

    // Handle completed boolean — allow null for "pending" state
    if ('completed' in data) {
      if (
        data.completed === true ||
        data.completed === false ||
        data.completed === null
      ) {
        // Valid value, keep as-is
      } else {
        return NextResponse.json(
          { error: 'completed باید true، false یا null باشد' },
          { status: 400 },
        );
      }
    }

    // If linked curriculum IDs are being updated and at least one is non-null,
    // resolve the text fields from DB (DB is source of truth).
    const task = await db.task.update({
      where: { id: taskId },
      data,
      include: taskTopicInclude,
    });

    // Save suggestions for teacher/class name and book name if they were updated
    const suggestionPromises: Promise<void>[] = [];
    if (hasClassVideo && 'teacherClassName' in body && typeof body.teacherClassName === 'string' && body.teacherClassName.trim() !== '') {
      suggestionPromises.push(
        db.taskDetailSuggestion.upsert({
          where: {
            studentId_subjectId_type_value: {
              studentId: existing.studentId,
              subjectId: curriculum.subject.id,
              type: 'teacherClass',
              value: body.teacherClassName.trim(),
            },
          },
          create: {
            studentId: existing.studentId,
            subjectId: curriculum.subject.id,
            type: 'teacherClass',
            value: body.teacherClassName.trim(),
          },
          update: {
            createdAt: new Date(),
          },
        }).then(() => {})
      );
    }
    if (hasTestDetails && 'bookName' in body && typeof body.bookName === 'string' && body.bookName.trim() !== '') {
      suggestionPromises.push(
        db.taskDetailSuggestion.upsert({
          where: {
            studentId_subjectId_type_value: {
              studentId: existing.studentId,
              subjectId: curriculum.subject.id,
              type: 'book',
              value: body.bookName.trim(),
            },
          },
          create: {
            studentId: existing.studentId,
            subjectId: curriculum.subject.id,
            type: 'book',
            value: body.bookName.trim(),
          },
          update: {
            createdAt: new Date(),
          },
        }).then(() => {})
      );
    }
    await Promise.all(suggestionPromises).catch((error) => console.error('Saving task suggestions failed:', error));

    const parsed = parseTaskResponse({ ...task });
    return NextResponse.json({ task: parsed });
  } catch (error) {
    console.error('PATCH /api/tasks/[taskId] error:', error);
    // Prisma not-found error on update
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json({ error: 'وظیفه یافت نشد' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی وظیفه' },
      { status: 500 },
    );
  }
}


// DELETE /api/tasks/[taskId] — Delete a task
// Authorization: caller must be able to modify the task (owner, assigned
// advisor, or super admin).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { ctx, error: authError } = await requireAuth(request);
  if (authError || !ctx) return authError;

  const { taskId } = await params;

  // Ownership check
  const canDelete = await canDeleteTask(ctx, taskId);
  if (!canDelete) {
    return NextResponse.json(
      { error: 'دسترسی به این تسک مجاز نیست' },
      { status: 403 },
    );
  }

  try {
    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[taskId] error:', error);
    if (error instanceof Error && error.message.includes('Record not found')) {
      return NextResponse.json({ error: 'وظیفه یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: 'خطا در حذف وظیفه' }, { status: 500 });
  }
}
