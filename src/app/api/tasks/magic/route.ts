import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { requireAuth, isTaskFieldType } from '@/lib/api-auth';
import { isValidTaskPageRange } from '@/lib/api-auth';
import { normalizePersianText } from '@/lib/validators/normalize';

// =====================================================================
// POST /api/tasks/magic
// "AI Magic Task Entry" — parses a Persian natural-language study plan
// into a structured, DB-resolved task object that the client can drop
// straight into the existing ManualEntrySheet as `initialTask`.
//
// Human-in-the-loop: this route NEVER writes to the database. It only
// resolves the LLM's extracted text (subject/chapter names) into real
// subjectId / chapterId / topicIds so the pre-filled form can pass
// through the existing validateTaskCurriculum flow unchanged.
// =====================================================================

export const runtime = 'nodejs';

const VALID_ACTIVITIES = new Set(['مطالعه', 'مرور', 'تست آموزشی', 'تست سنجشی', 'کلاس/ویدیو']);

interface ExtractedTask {
  subjectName: string | null;
  chapterNo: number | null;
  chapterName: string | null;
  topicNames: string[] | null;
  activityTypes: string[] | null;
  targetTestCount: number | null;
  targetTimeMinutes: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  fieldType: 'کنکور' | 'نهایی' | null;
}

interface ResolvedTask {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  chapterId: string;
  chapterTitle: string;
  chapterPageStart: number | null;
  chapterPageEnd: number | null;
  topicId: string | null;
  topicIds: string[];
  topicTitles: string[];
  curriculumMode: 'BOOK';
  fieldType: 'کنکور' | 'نهایی';
  activityTypes: string[];
  targetTimeMinutes: number | null;
  targetTestCount: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  displayText: string;
  rawInput: string;
  warnings: string[];
}

// Strip markdown ```json fences and trailing prose so we can JSON.parse
// even if the model adds commentary.
function extractJson(content: string): string {
  let s = content.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Fallback: grab the first {...} block.
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
  return s;
}

function buildCurriculumContext(
  subjects: Array<{
    id: string;
    name: string;
    grades: Array<{
      grade: string;
      major: string;
      isKonkur: boolean;
      isFinal: boolean;
      chapters: Array<{ chapterNo: number; title: string }>;
    }>;
  }>,
): string {
  return subjects
    .map((s) => {
      const gradeLines = s.grades
        .map((g) => {
          const modes = [g.isKonkur ? 'کنکور' : null, g.isFinal ? 'نهایی' : null].filter(Boolean).join('/');
          const chapters = g.chapters
            .map((c) => `${c.chapterNo}:${c.title}`)
            .join(' | ');
          return `  - پایه ${g.grade} رشته ${g.major} (${modes}): فصل‌ها → ${chapters}`;
        })
        .join('\n');
      return `درس «${s.name}»\n${gradeLines}`;
    })
    .join('\n');
}

const SYSTEM_PROMPT = (curriculumContext: string) => `تو یک دستیار هوشمند برای اپلیکیشن برنامه‌ریزی درسی «روال» هستی. کاربر متن آزاد فارسیِ برنامه مطالعه‌اش را می‌نویسد و تو باید آن را به یک شیء JSON ساختاریافته تبدیل کنی.

داده‌های معتبر برنامه درسی (فقط از بین این‌ها انتخاب کن):
${curriculumContext}

قواعد استخراج:
- subjectName: نام دقیق درس از لیست بالا. اگر کاربر مخفف گفت (مثل «زیست دهم» یا «زیست») آن را به نام دقیق نزدیک‌ترین درس تطبیق بده.
- chapterNo: شماره فصل (عدد). اگر کاربر گفت «فصل ۲» یا «فصل دوم»، chapterNo=۲. اگر نام فصل گفت، شماره‌اش را از لیست پیدا کن.
- chapterName: نام دقیق فصل از لیست (اختیاری در کنار chapterNo).
- topicNames: آرایه‌ای از نام گفتارها اگر ذکر شده‌اند (اختیاری).
- activityTypes: آرایه‌ای از فعالیت‌ها. مقادیر مجاز فقط: "مطالعه"، "مرور"، "تست آموزشی"، "تست سنجشی"، "کلاس/ویدیو". اگر گفت «تست زدن» یا «تست آموزشی» → ["تست آموزشی"]. اگر گفت «مرور» → ["مرور"]. اگر گفت «خواندن» یا «مطالعه» → ["مطالعه"]. اگر گفت «کلاس» یا «ویدیو» → ["کلاس/ویدیو"].
- targetTestCount: تعداد تست (عدد صحیح یا null).
- targetTimeMinutes: زمان به دقیقه (عدد صحیح یا null). اگر ساعت گفت، به دقیقه تبدیل کن (مثلاً «۱ ساعت» → ۶۰).
- pageStart / pageEnd: بازه صفحه اگر ذکر شده (عدد یا null).
- fieldType: "کنکور" یا "نهایی". اگر مشخص نشد، پیش‌فرض "کنکور".

خروجی را فقط به‌صورت یک JSON معتبر برگردان، بدون متن اضافه، بدون markdown.

مثال ۱:
ورودی: «فردا شب ۵۰ تا تست آموزشی زیست دهم فصل ۲ رو می‌زنم»
خروجی: {"subjectName":"زیست‌شناسی 1","chapterNo":2,"chapterName":null,"topicNames":null,"activityTypes":["تست آموزشی"],"targetTestCount":50,"targetTimeMinutes":null,"pageStart":null,"pageEnd":null,"fieldType":"کنکور"}

مثال ۲:
ورودی: «امروز صبح ۱ ساعت مطالعه فیزیک فصل ۳ صفحات ۴۰ تا ۵۵»
خروجی: {"subjectName":"فیزیک 1","chapterNo":3,"chapterName":null,"topicNames":null,"activityTypes":["مطالعه"],"targetTestCount":null,"targetTimeMinutes":60,"pageStart":40,"pageEnd":55,"fieldType":"کنکور"}

مثال ۳:
ورودی: «یک ساعت مرور شیمی فصل ۱ گفتار اتم»
خروجی: {"subjectName":"شیمی 1","chapterNo":1,"chapterName":null,"topicNames":["اتم"],"activityTypes":["مرور"],"targetTestCount":null,"targetTimeMinutes":60,"pageStart":null,"pageEnd":null,"fieldType":"کنکور"}

اگر چیزی قابل استخراج نبود، همه فیلدها را null یا آرایه خالی بگذار.`;

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireAuth(request);
  if (error || !ctx) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const rawInput = typeof body.text === 'string' ? body.text.trim() : '';
    if (!rawInput) {
      return NextResponse.json({ error: 'متن برنامه مطالعه خالی است' }, { status: 400 });
    }

    // Load the student's profile (grade + major) — needed for curriculum resolution.
    const student = await db.user.findFirst({
      where: { id: ctx.userId, role: 'STUDENT', isActive: true },
      select: { grade: true, major: true },
    });
    if (!student?.grade || !student.major) {
      return NextResponse.json({ error: 'پایه و رشته تحصیلی شما مشخص نیست — ابتدا در تنظیمات تکمیل کنید' }, { status: 400 });
    }

    // Load available subjects + chapters for this student's grade/major.
    const subjects = await db.subject.findMany({
      where: { isActive: true, grades: { some: { grade: student.grade, major: student.major, isActive: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        color: true,
        grades: {
          where: { grade: student.grade, major: student.major, isActive: true },
          select: {
            grade: true,
            major: true,
            isKonkur: true,
            isFinal: true,
            chapters: { where: { isActive: true }, select: { chapterNo: true, title: true }, orderBy: { chapterNo: 'asc' } },
          },
        },
      },
    });

    if (subjects.length === 0) {
      return NextResponse.json({ error: 'برنامه درسی برای پایه/رشته شما تعریف نشده است' }, { status: 404 });
    }

    const curriculumContext = buildCurriculumContext(subjects);

    // Call the LLM to extract a structured JSON object.
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: SYSTEM_PROMPT(curriculumContext) },
        { role: 'user', content: rawInput },
      ],
      thinking: { type: 'disabled' },
    });
    const content = completion.choices[0]?.message?.content ?? '';
    const jsonText = extractJson(content);
    let extracted: ExtractedTask;
    try {
      extracted = JSON.parse(jsonText) as ExtractedTask;
    } catch {
      return NextResponse.json(
        { error: 'متأسفانه نتوانستم متن شما را پردازش کنم. لطفاً دقیق‌تر بنویسید.', raw: content.slice(0, 500) },
        { status: 422 },
      );
    }

    // ===== Resolve extracted text into DB IDs =====
    const warnings: string[] = [];
    const fieldType: 'کنکور' | 'نهایی' = isTaskFieldType(extracted.fieldType) ? extracted.fieldType : 'کنکور';

    // Resolve subject by normalized name.
    const targetSubjectNorm = normalizePersianText(extracted.subjectName ?? '');
    const subject = subjects.find((s) => normalizePersianText(s.name) === targetSubjectNorm)
      ?? subjects.find((s) => normalizePersianText(s.name).includes(targetSubjectNorm) || targetSubjectNorm.includes(normalizePersianText(s.name)));
    if (!subject) {
      return NextResponse.json(
        { error: `درس «${extracted.subjectName ?? ''}» در برنامه شما پیدا نشد. لطفاً نام درس را بررسی کنید.` },
        { status: 404 },
      );
    }

    // Resolve grade-subject for the student's grade/major + fieldType eligibility.
    const gradeSubject = subject.grades.find((g) => (fieldType === 'کنکور' ? g.isKonkur : g.isFinal));
    if (!gradeSubject) {
      return NextResponse.json(
        { error: `درس «${subject.name}» برای حوزه ${fieldType} در پایه/رشته شما فعال نیست` },
        { status: 404 },
      );
    }

    // Fetch the full GradeSubject row (we only have chapters via subject query; refetch to be safe).
    const fullGradeSubject = await db.gradeSubject.findFirst({
      where: { subjectId: subject.id, grade: student.grade, major: student.major, isActive: true },
      select: {
        id: true,
        chapters: {
          where: { isActive: true },
          select: { id: true, chapterNo: true, title: true, pageStart: true, pageEnd: true, topics: { where: { isActive: true }, select: { id: true, title: true, topicNo: true }, orderBy: { topicNo: 'asc' } } },
          orderBy: { chapterNo: 'asc' },
        },
      },
    });
    if (!fullGradeSubject) {
      return NextResponse.json({ error: 'ساختار برنامه درسی معتبر نیست' }, { status: 404 });
    }

    // Resolve chapter by number first, then by normalized title.
    let chapter = fullGradeSubject.chapters.find((c) => extracted.chapterNo != null && c.chapterNo === extracted.chapterNo);
    if (!chapter && extracted.chapterName) {
      const norm = normalizePersianText(extracted.chapterName);
      chapter = fullGradeSubject.chapters.find((c) => normalizePersianText(c.title) === norm)
        ?? fullGradeSubject.chapters.find((c) => normalizePersianText(c.title).includes(norm));
    }
    if (!chapter) {
      return NextResponse.json(
        { error: `فصل «${extracted.chapterName ?? extracted.chapterNo ?? ''}» برای درس «${subject.name}» پیدا نشد.` },
        { status: 404 },
      );
    }

    // Resolve topics by normalized title (optional).
    const topicIds: string[] = [];
    const topicTitles: string[] = [];
    if (Array.isArray(extracted.topicNames)) {
      for (const rawTitle of extracted.topicNames) {
        const norm = normalizePersianText(rawTitle);
        const topic = chapter.topics.find((t) => normalizePersianText(t.title) === norm)
          ?? chapter.topics.find((t) => normalizePersianText(t.title).includes(norm) || norm.includes(normalizePersianText(t.title)));
        if (topic && !topicIds.includes(topic.id)) {
          topicIds.push(topic.id);
          topicTitles.push(topic.title);
        } else {
          warnings.push(`گفتار «${rawTitle}» پیدا نشد`);
        }
      }
    }

    // Normalize + validate activity types.
    const activityTypes = Array.isArray(extracted.activityTypes)
      ? extracted.activityTypes.filter((a): a is string => typeof a === 'string' && VALID_ACTIVITIES.has(a))
      : [];

    // Validate page range against the chapter bounds; drop invalid values.
    let pageStart = Number.isInteger(extracted.pageStart) ? (extracted.pageStart as number) : null;
    let pageEnd = Number.isInteger(extracted.pageEnd) ? (extracted.pageEnd as number) : null;
    if (!isValidTaskPageRange(pageStart, pageEnd)) {
      pageStart = null;
      pageEnd = null;
      warnings.push('بازه صفحه نامعتبر بود و حذف شد');
    } else if (pageStart != null && pageEnd != null && chapter.pageStart != null && chapter.pageEnd != null) {
      if (pageStart < chapter.pageStart || pageEnd > chapter.pageEnd) {
        pageStart = null;
        pageEnd = null;
        warnings.push('بازه صفحه خارج از محدوده فصل بود و حذف شد');
      }
    }

    const targetTestCount = Number.isInteger(extracted.targetTestCount) && (extracted.targetTestCount as number) >= 0
      ? (extracted.targetTestCount as number)
      : null;
    const targetTimeMinutes = Number.isInteger(extracted.targetTimeMinutes) && (extracted.targetTimeMinutes as number) > 0
      ? (extracted.targetTimeMinutes as number)
      : null;

    const displayText = topicTitles.length
      ? [chapter.title, ...topicTitles].join(' · ')
      : chapter.title;

    const resolved: ResolvedTask = {
      subjectId: subject.id,
      subjectName: subject.name,
      subjectColor: subject.color ?? undefined,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterPageStart: chapter.pageStart,
      chapterPageEnd: chapter.pageEnd,
      topicId: topicIds[0] ?? null,
      topicIds,
      topicTitles,
      curriculumMode: 'BOOK',
      fieldType,
      activityTypes,
      targetTimeMinutes,
      targetTestCount,
      pageStart,
      pageEnd,
      displayText,
      rawInput,
      warnings,
    };

    return NextResponse.json({ task: resolved });
  } catch (cause) {
    console.error('POST /api/tasks/magic error:', cause);
    return NextResponse.json({ error: 'خطا در پردازش هوش مصنوعی. لطفاً دوباره تلاش کنید.' }, { status: 500 });
  }
}
