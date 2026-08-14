# دفترچه عملیاتی تکمیل معماری Curriculum

## 1. هدف و روش اجرا

این فایل منبع واحد برنامه، تصمیم‌ها، وضعیت اجرا، نتایج اعتبارسنجی و موانع تسک Curriculum است. اجرای کار مرحله‌ای و متوقف‌شونده است:

1. در هر نوبت فقط یک مرحله با وضعیت `IN_PROGRESS` اجرا می‌شود.
2. پس از پایان همان مرحله، وضعیت، فایل‌های تغییرکرده، فرمان‌های اجراشده و نتیجه داخل همین فایل ثبت می‌شود.
3. ورود به مرحله بعد فقط پس از دستور صریح کاربر انجام می‌شود.
4. تغییرات موجود کاربران یا عامل‌های دیگر بازگردانده نمی‌شوند.
5. پایان کل تسک فقط زمانی اعلام می‌شود که تمام معیارهای پذیرش بخش 8 پاس شده باشند.

## 2. محدوده

### داخل محدوده

- قرارداد داده Curriculum در Prisma و migration امن برای داده‌های فعلی.
- ساختار کتابی `Subject -> GradeSubject -> Chapter -> Topic`.
- ساختار مبحثی `Subject -> GradeSubject -> TopicMode -> TopicModeSubtopic`.
- انتقال صلاحیت کنکور/نهایی از `Subject` به `GradeSubject`.
- حذف `isLastPage` و یکسان‌سازی قرارداد بازه صفحه.
- APIهای مدیریت Curriculum و APIهای افزودن/ویرایش تسک.
- جریان مشترک انتخاب درس برای دانش‌آموز و مشاور.
- پنل Super Admin برای مدیریت هر دو ساختار.
- importer/seed کتابی و مبحثی.
- تست‌ها، TypeScript، ESLint، Prisma validation و build.

### خارج از محدوده

- تغییرات OTP/SMS، مگر فقط برای جلوگیری از تداخل در اعتبارسنجی نهایی.
- بازطراحی بخش‌های نامرتبط محصول.
- حذف یا بازگرداندن فایل‌های کاربر و تغییرات نامرتبط موجود در worktree.
- اجرای migration مخرب، `migrate reset` یا دست‌کاری داده production.

## 3. قرارداد نهایی مورد انتظار

### صلاحیت ارزیابی

- `Subject` فقط metadata عمومی درس را نگه می‌دارد.
- `GradeSubject.isKonkur` و `GradeSubject.isFinal` صلاحیت ترکیب درس/پایه/رشته را تعیین می‌کنند.
- حداقل یکی از این دو flag برای GradeSubject فعال باید `true` باشد.
- `fieldType=کنکور` فقط GradeSubject دارای `isKonkur=true` را می‌پذیرد.
- `fieldType=نهایی` فقط GradeSubject دارای `isFinal=true` را می‌پذیرد.

### ساختار کتابی

- `Chapter` متعلق به `GradeSubject` است و `Topic` متعلق به `Chapter`.
- `pageStart` و `pageEnd` یا هر دو مقدار معتبر مثبت دارند یا هر دو `null` هستند.
- اگر هر دو مقدار دارند، `pageStart <= pageEnd` است.
- هیچ فیلد یا منطق `isLastPage` در schema، API، UI، importer یا types باقی نمی‌ماند.

### ساختار مبحثی

- هر `TopicMode` جدید الزاماً به یک `GradeSubject` متعلق است.
- `subjectId` ذخیره‌شده روی TopicMode باید با subject والد GradeSubject یکسان باشد.
- هر `TopicModeSubtopic` فقط به TopicMode والد خود متعلق است.
- list/get فقط رکوردهای فعال را برمی‌گرداند.
- delete مدیریتی soft delete است؛ داده مرتبط با Task حذف فیزیکی نمی‌شود.
- شماره‌های `modeNo` و `subtopicNo` در parent مربوطه یکتا و مثبت‌اند.

### تسک

- `curriculumMode` فقط `BOOK` یا `THEMATIC` است.
- در `BOOK`، TopicMode/Subtopic پذیرفته نمی‌شود.
- در `THEMATIC`، Chapter/Topic/page range پذیرفته نمی‌شود.
- تمام شناسه‌های انتخاب‌شده باید به همان Subject و GradeSubject واجد صلاحیت متعلق باشند.
- زیرمبحث‌ها باید فعال و متعلق به TopicMode انتخاب‌شده باشند.
- همین validation در create، batch create و update اعمال می‌شود.

### importer و seed

- `seed.xlsx` فقط ساختار کتابی و `topic-seed.xlsx` فقط ساختار مبحثی را وارد می‌کند.
- validation کامل قبل از write و write داخل transaction انجام می‌شود.
- خطا شامل نام فایل، sheet و شماره ردیف است.
- import حذف فیزیکی انجام نمی‌دهد و داده ناموجود در Excel را خودکار پاک نمی‌کند.
- مقدار `نوع ارزیابی` فقط `کنکور`، `نهایی` یا `هر دو` است.

## 4. قواعد ایمنی migration

- استقرار greenfield است و حفظ هیچ داده یا migration قدیمی الزامی نیست.
- migrationها به یک baseline واحد برای ساخت دیتابیس از صفر تبدیل می‌شوند.
- `Subject.isKonkur` در schema نهایی وجود ندارد.
- `TopicMode.gradeSubjectId` اجباری است و TopicMode مستقل/legacy وجود ندارد.
- هیچ backfill، compatibility column یا مسیر ارتقای داده قدیمی نگه داشته نمی‌شود.
- baseline باید با PostgreSQL و `prisma migrate deploy` روی دیتابیس خالی سازگار باشد.
- هر تغییر schema باید با migration متناظر و Prisma Client تازه تولیدشده بررسی شود.

## 5. مراحل اجرایی

### مرحله 1: ممیزی خط مبنا و تثبیت قرارداد

وضعیت: `COMPLETED`

اقدامات:

- ثبت وضعیت Git و تفکیک تغییرات Curriculum از تغییرات نامرتبط.
- بررسی schema، migration، types، APIها، UI، importerها و تست‌های فعلی.
- اجرای baseline برای Prisma، TypeScript، ESLint هدفمند و تست‌های مرتبط قابل اجرا.
- جست‌وجوی تمام مصرف‌کننده‌های legacy شامل `Subject.isKonkur`، `isLastPage` و endpointهای subject-global TopicMode.
- ثبت gapها، ریسک‌ها، ترتیب وابستگی‌ها و قرارداد قطعی مراحل بعد.

معیار پایان:

- inventory فایل‌ها و gapها کامل باشد.
- خطاهای baseline با فرمان و خروجی مشخص ثبت شده باشند.
- هیچ تصمیم قراردادی باز و مبهم برای شروع مرحله 2 باقی نماند.

نتیجه اجرا:

- inventory تغییرات tracked شامل schema، migration، APIهای subjects/grades/chapters/topics/page-lookup، APIهای tasks، types، picker مشترک، ManualEntrySheet، Super Admin و importerها ثبت شد.
- فایل‌های نامرتبط شناسایی‌شده در worktree شامل OTP/SMS و فایل تست پیامک هستند و در مراحل Curriculum دست‌کاری نمی‌شوند.
- ساختار واقعی `seed.xlsx`: شیت `Data`، تعداد ۲۱۰ ردیف شامل header، ۱۶ ستون مورد انتظار؛ ستون `نوع ارزیابی` در نمونه‌های بررسی‌شده خالی است و قبل از import باید validation آن را رد کند.
- ساختار واقعی `topic-seed.xlsx`: شیت‌های `Data` و `README`؛ شیت Data تعداد ۸ ردیف شامل header و ۱۰ ستون مورد انتظار دارد و داده‌های آن نمونه‌ای است.
- قرارداد قطعی برای ادامه: page pair-or-null، eligibility در GradeSubject، TopicMode فقط grade-scoped، و زیرمبحث فقط nested و ownership-safe.

Baseline اجراشده:

- `npx prisma validate`: موفق.
- `npx prisma generate`: موفق؛ Prisma Client نسخه 6.19.3 تولید شد.
- `npm test`: موفق؛ ۶ فایل تست و ۴۲ تست پاس شدند.
- ESLint هدفمند روی فایل‌های Curriculum: بدون خطای اجرایی؛ اجرای مستقیم روی `prisma/schema.prisma` فقط warning مربوط به ignore شدن فایل داد.
- `npx tsc --noEmit`: ناموفق با یک خطای مشخص در `src/components/shared/TaskSubjectPicker.tsx:132`؛ `ApiGradeSubject` فیلدهای الزامی `isKonkur` و `isFinal` را ندارد.
- `git diff --check`: موفق.

Gapهای اولویت‌دار برای مراحل بعد:

1. migration فعلی در `prisma/migrations/20260813163500_curriculum_modes/migration.sql:8-12` مقدار `isFinal=true` را برای تمام GradeSubjectهای موجود backfill می‌کند؛ این حدس با قرارداد داده معتبر نیست و پیش از deploy باید تعیین تکلیف شود.
2. `Subject.isKonkur` هنوز در schema، APIهای `src/app/api/subjects/route.ts` و `[subjectId]/route.ts`، seedها و Analytics مصرف می‌شود؛ حذف آن باید بعد از انتقال کامل مصرف‌کننده‌ها انجام شود.
3. endpointهای legacy در `src/app/api/subjects/[subjectId]/topic-modes/**` هنوز subject-global CRUD هستند و باید به مسیر grade-scoped تبدیل یا مسدود شوند.
4. مسیر nested grade-scoped برای TopicMode/Subtopic هنوز در baseline وجود ندارد.
5. `validateTaskCurriculum` در `src/lib/api-auth.ts:277` GradeSubject دقیق، active بودن parent و eligibility را کامل به ورودی متصل نمی‌کند؛ create/update/batch نیز قرارداد یکسانی ندارند.
6. `src/app/api/tasks/batch/route.ts:114-151` در create batch، `curriculumMode` و relationهای `topicModeSubtopics` را ذخیره نمی‌کند و باید با create عادی یکسان شود.
7. `src/app/api/subjects/route.ts` و `[subjectId]/route.ts` در include tree، TopicMode را زیر Subject برمی‌گردانند؛ مصرف‌کننده‌ها باید به TopicModeهای هر GradeSubject مهاجرت کنند.
8. `prisma/sync-curriculum-from-csv.ts` هنوز CSV قدیمی و metadata دارای Subject-level `isKonkur` مصرف می‌کند و Excelهای جدید را وارد نمی‌کند.
9. `prisma/seed-subjects.ts` destructive است، TopicMode را به Subject متصل می‌کند و flags GradeSubject را تنظیم نمی‌کند؛ نباید به‌عنوان importer production استفاده شود.
10. `src/lib/subjects-types.ts` چند فیلد legacy optional دارد و همین باعث پنهان‌شدن قرارداد ناقص و خطای ارث‌بری picker شده است؛ types باید در مرحله ۴ یکپارچه شوند.
11. پوشش تست Curriculum وجود ندارد؛ ۴۲ تست baseline عمدتاً حوزه‌های دیگر را پوشش می‌دهند.

تصمیم‌های تثبیت‌شده برای مرحله 2:

- `isFinal` از روی Subject یا حدس عمومی backfill نمی‌شود؛ منبع معتبر آن Excel با نوع ارزیابی است. در نبود منبع معتبر، مقدار false باقی می‌ماند و گزارش migration/seed باید صریح باشد.
- رکوردهای TopicMode legacy با `gradeSubjectId=null` به‌صورت خودکار به هیچ GradeSubjectی نگاشت نمی‌شوند. ابتدا باید read compatibility و تصمیم نگاشت صریح مشخص شود؛ CRUD جدید فقط با gradeSubjectId مجاز است.
- `Subject.isKonkur` تا پایان مهاجرت API، task flow، analytics و seedها باقی می‌ماند اما در قرارداد جدید قابل نوشتن/خواندن برای eligibility نیست؛ حذف فیزیکی در مرحله ۲ یا migration بعدی انجام می‌شود.
- `isLastPage` از schema canonical حذف شده و هیچ مصرف‌کننده اجرایی در `src` ندارد؛ referenceهای migration تاریخی مجازند باقی بمانند.
- مقدار ارزیابی خالی در فایل `seed.xlsx` معتبر نیست و importer باید با file/sheet/row گزارش خطا متوقف شود.

اصلاح تصمیم در `2026-08-13 18:20 +03:30`:

- کاربر استقرار را کاملاً greenfield اعلام کرد و حذف داده‌های لوکال و Liara را مجاز دانست.
- تمام سیاست‌های compatibility و backfill بالا لغو شدند.
- خروجی مرحله ۲ یک schema canonical بدون فیلد legacy و یک baseline migration واحد خواهد بود.

معیار پایان: پاس شد. مرحله ۲ وابسته به رفع R1 و تعیین راهبرد R2 است.

### مرحله 2: Prisma schema، migration و ارتقای داده

وضعیت: `COMPLETED`

اقدامات:

- نهایی‌سازی مدل‌های Subject، GradeSubject، Chapter، Topic، TopicMode، TopicModeSubtopic و Task.
- طراحی migration ترتیبی و امن برای backfill، legacy rows و constraintها.
- حذف نهایی `Subject.isKonkur` و `isLastPage` در صورت آماده بودن تمام مصرف‌کننده‌ها.
- تعیین راهبرد روشن برای TopicModeهای legacy بدون GradeSubject.
- اجرای format/validate/generate و بررسی SQL migration.

معیار پایان:

- `prisma format` و `prisma validate` پاس شوند.
- Prisma Client با schema جدید generate شود.
- schema و migration دقیقاً یک قرارداد داشته باشند.
- مسیر داده legacy مستند و بدون حدس مخرب باشد.

نتیجه اجرای greenfield:

- تمام migrationهای تاریخی و migrationهای جبرانی موقت حذف شدند.
- فقط یک baseline canonical باقی ماند: `prisma/migrations/20260813182500_greenfield_baseline/migration.sql`.
- دیتابیس لوکال با `prisma migrate reset --force --skip-seed` کاملاً پاک و از baseline جدید ساخته شد.
- دیتابیس بعد از reset خالی است: `User=0`، `Subject=0` و `Task=0`.
- `Subject.isKonkur` از schema حذف شد و eligibility فقط روی GradeSubject است.
- `TopicMode.subjectId` حذف و `TopicMode.gradeSubjectId` اجباری شد؛ هیچ مدل legacy بدون scope وجود ندارد.
- `CurriculumMode` به enum دیتابیس با مقادیر `BOOK` و `THEMATIC` تبدیل شد.
- constraintهای eligibility، page pair، sequence number و شکل BOOK/THEMATIC مستقیماً در baseline اضافه شدند.
- `npx prisma validate`، `npx prisma generate` و `npx prisma migrate status` موفق شدند.
- `prisma migrate diff` میان دیتابیس ساخته‌شده و schema هیچ driftی گزارش نکرد.
- `git diff --check` برای فایل‌های مرحله ۲ موفق بود.
- تمام ۴۲ تست موجود همچنان پاس شدند.
- TypeScript طبق انتظار اکنون مصرف‌کننده‌های legacy را آشکار می‌کند؛ خطاها محدود به APIها، seedها، types و task validation هستند و مالک مراحل ۳، ۴ و ۶ محسوب می‌شوند.

فایل‌های مرحله ۲:

- `prisma/schema.prisma`
- `prisma/migrations/20260813182500_greenfield_baseline/migration.sql`
- `prisma/migrations/migration_lock.toml`
- حذف migrationهای تاریخی قبلی زیر `prisma/migrations/*/migration.sql`
- `CURRICULUM_IMPLEMENTATION_RUNBOOK.md`

معیار پایان: پاس شد. حفظ داده و compatibility دیگر بخشی از هیچ مرحله‌ای نیست.

### مرحله 3: APIهای Curriculum و TopicMode/Subtopic

وضعیت: `COMPLETED`

اقدامات:

- تکمیل APIهای GradeSubject و Chapter/Topic طبق قرارداد صفحه.
- ایجاد CRUD کامل grade-scoped برای TopicMode.
- ایجاد CRUD nested برای TopicModeSubtopic.
- اعمال ownership زنجیره‌ای، active filtering، validation و soft delete.
- حذف یا تبدیل endpointهای legacy subject-global به پاسخ migration-safe بدون CRUD موازی.
- یکسان‌سازی status code و payload خطاها.

معیار پایان:

- هیچ CRUD جدید TopicMode بدون GradeSubject ممکن نباشد.
- تمام parent-child ownershipها در سرور بررسی شوند.
- APIهای جدید lint/typecheck شوند و تست route/service داشته باشند.

نتیجه اجرا:

- API عمومی Subject از eligibility سطح Subject پاک شد و فیلترهای `isKonkur`/`isFinal` را روی GradeSubject اعمال می‌کند.
- پاسخ tree در `GET /api/subjects` و `GET /api/subjects/[subjectId]` اکنون TopicMode و subtopic را داخل هر GradeSubject فعال برمی‌گرداند.
- ایجاد/ویرایش Subject فقط metadata عمومی را می‌پذیرد و payloadهای نوع/ترتیب اعتبارسنجی می‌شوند.
- APIهای GradeSubject حداقل یک eligibility فعال، parent فعال، انواع boolean و sortOrder معتبر را enforce می‌کنند.
- endpointهای subject-global زیر حذف شدند:
  - `src/app/api/subjects/[subjectId]/topic-modes/route.ts`
  - `src/app/api/subjects/[subjectId]/topic-modes/[modeId]/route.ts`
- CRUD canonical جدید ایجاد شد:
  - `GET/POST /api/subjects/[subjectId]/grades/[gradeSubjectId]/topic-modes`
  - `PATCH/DELETE /api/subjects/[subjectId]/grades/[gradeSubjectId]/topic-modes/[modeId]`
  - `GET/POST .../[modeId]/subtopics`
  - `PATCH/DELETE .../[modeId]/subtopics/[subtopicId]`
- تمام عملیات nested زنجیره `Subject -> GradeSubject -> TopicMode -> TopicModeSubtopic` را بررسی می‌کنند.
- readها فقط parent و child فعال را نمایش می‌دهند؛ deleteها soft delete هستند و حذف mode زیرمبحث‌های فعال آن را نیز غیرفعال می‌کند.
- شماره‌گذاری مثبت، conflict با status `409` و reactivation رکورد soft-deleted پیاده‌سازی شد.
- تغییر عنوان mode/subtopic summary متنی Taskهای مرتبط را همگام می‌کند.
- Chapter/Topic APIها با parent فعال، عنوان trim‌شده، page pair validation، sortOrder و boolean معتبر سخت‌گیرانه شدند.
- helper مشترک `src/lib/curriculum-api.ts` برای ownership، parsing و task-summary sync اضافه شد.

اعتبارسنجی:

- `npx next typegen`: موفق؛ route typeهای legacy پس از پاک‌کردن `.next` حذف شدند.
- ESLint هدفمند تمام APIهای Subject و helperها: موفق، صفر warning/error.
- `git diff --check` در scope مرحله ۳: موفق.
- `npm test`: موفق؛ ۶ فایل و ۴۲ تست پاس شدند.
- `npx prisma validate` و `npx prisma migrate status`: موفق.
- smoke test مستقیم handlerها: create mode `201`، create subtopic `201`، patch `200`، parent اشتباه `404`، soft delete و active filtering همگی موفق.
- `tsc --noEmit`: هیچ خطایی در APIهای مرحله ۳ ندارد؛ خطاهای باقی‌مانده فقط seed/importer مرحله ۶ و `TaskSubjectPicker` مرحله ۴ هستند.

معیار پایان: پاس شد. APIهای canonical برای مصرف مراحل ۴ و ۵ آماده‌اند.

### مرحله 4: Types، task flows و page lookup

وضعیت: `COMPLETED`

اقدامات:

- یکسان‌سازی types سمت client/server با schema.
- تکمیل `for-task` و picker مشترک دانش‌آموز/مشاور.
- تکمیل create، batch create و update تسک با validation مرکزی.
- تضمین جدایی BOOK/THEMATIC و اعتبارسنجی eligibility.
- اصلاح page lookup و page-range validation بدون `isLastPage`.

معیار پایان:

- مسیرهای create/update/batch رفتار یکسان و امن داشته باشند.
- TypeScript در فایل‌های این مرحله بدون خطا باشد.
- تست دست‌کاری payload نامعتبر status `400` را تأیید کند.

نتیجه اجرا:

- `validateTaskCurriculum` در `src/lib/api-auth.ts` به validator مرکزی تبدیل شد و `studentId`، `subjectId`، `fieldType`، `curriculumMode` و parent chain را هم‌زمان بررسی می‌کند.
- eligibility اکنون روی همان GradeSubject متعلق به chapter یا TopicMode اعمال می‌شود؛ انتخاب Subject مجاز به‌تنهایی کافی نیست.
- BOOK فقط chapter فعال متعلق به pivot واجد شرایط را می‌پذیرد و topicها باید متعلق به همان chapter باشند.
- THEMATIC فقط TopicMode فعال متعلق به pivot واجد شرایط را می‌پذیرد و chapter/topic/page را رد می‌کند.
- BOOK و THEMATIC هر دو باید explicit باشند و payload mixed با `400` رد می‌شود.
- page range در تمام task flowها pair-or-null، مثبت و `start <= end` است؛ بازه ناقص با `400` رد می‌شود.
- create، batch create و update از همان validator و خروجی canonical استفاده می‌کنند.
- batch create اکنون `curriculumMode` و relationهای `topicModeSubtopics` را ذخیره می‌کند.
- PATCH هنگام تغییر mode تمام FKها و relationهای متضاد را پاک و relationهای جدید را بازسازی می‌کند.
- PATCH تغییر topicهای چندگانه و تغییر Subject را بدون نگه‌داشتن `topicId` یا Subject قدیمی مدیریت می‌کند.
- `TaskSubjectPicker`، `TaskSelection`، `Task`، `task-service` و Zustand store با `curriculumMode`، topicهای چندگانه، subtopicها و page pair همگام شدند.
- Advisor، Dashboard و WeeklyPlanner هنگام prefill و edit تمام شناسه‌های curriculum را حفظ می‌کنند.
- Analytics به‌جای `Subject.isKonkur` و `subject.chapters/topicModes` از `GradeSubject`های nested استفاده می‌کند.
- page lookup فقط GradeSubject و Subject فعال متعلق به مسیر را می‌پذیرد.

اعتبارسنجی:

- lint هدفمند مرحله ۴: موفق، بدون warning/error.
- `git diff --check` در scope مرحله ۴: موفق.
- `npm test`: موفق؛ ۶ فایل و ۴۲ تست پاس شدند.
- smoke test task flow: BOOK و THEMATIC هر دو `201`، batch هر دو mode را ذخیره کرد، PATCH تبدیل BOOK به THEMATIC را با پاک‌سازی relationها انجام داد، و mixed/GradeSubject نامجاز/page ناقص همگی `400` شدند.
- `npx tsc --noEmit`: کد اجرایی مرحله ۴ بدون خطا است؛ خطاهای باقی‌مانده فقط `prisma/seed.ts`، `prisma/seed-subjects.ts` و `prisma/sync-curriculum-from-csv.ts` در scope مرحله ۶ هستند.

معیار پایان: پاس شد. قرارداد task برای UI نهایی و importer آماده است.

### مرحله 5: Super Admin UI

وضعیت: `COMPLETED`

اقدامات:

- یکپارچه‌سازی فرم Subject و GradeSubject flags.
- تکمیل نمای ساختار کتابی با page pair validation.
- تکمیل نمای مبحثی grade-scoped و ویرایش زیرمبحث‌ها.
- کنترل refresh/persistence، loading/error state و soft delete confirmation.
- حذف تمام UIهای legacy برای Subject-level eligibility و `isLastPage`.

معیار پایان:

- UI فقط endpointها و types نهایی را مصرف کند.
- ویرایش پس از refresh باقی بماند.
- ESLint و TypeScript scoped پاس شوند.

نتیجه اجرا:

- selector واحد GradeSubject به هر دو نمای کتابی و مبحثی متصل شد و کلیک کارت پایه همان pivot را انتخاب می‌کند.
- eligibility کنکور/نهایی فقط روی GradeSubject مدیریت می‌شود و خاموش‌کردن آخرین eligibility در UI مجاز نیست.
- CurriculumWizard هنگام ایجاد pivot جدید eligibility معتبر می‌فرستد و پس از create/save/delete والد را refresh می‌کند.
- validation محلی chapter/topic برای شماره مثبت، page pair و ترتیب بازه تکمیل شد.
- باگ accordion گفتارها که شناسه متنی chapter را با `parseInt` می‌خواند رفع شد.
- باگ انتخاب Subject جدید از لیست stale در wizard رفع شد.
- TopicMode/Subtopic از endpointهای canonical استفاده می‌کنند، شماره قابل مدیریت دارند و عملیات حذف loading state دارد.
- وضعیت آماده‌بودن Subject هر دو ساختار کتابی و مبحثی را در نظر می‌گیرد.
- تنظیمات Subject فقط metadata، sortOrder و isActive را مدیریت می‌کند.
- هیچ reference اجرایی به `isLastPage`، Subject-level eligibility یا ساختار top-level legacy در Super Admin باقی نماند.

اعتبارسنجی:

- ESLint کل `src/components/super-admin`: موفق.
- `git diff --check` در scope Super Admin: موفق.
- `npm test`: ۶ فایل و ۴۲ تست موفق.
- TypeScript در scope UI مرحله ۵ خطا ندارد؛ خطاهای کل پروژه فقط importerهای مالک مرحله ۶ هستند.

معیار پایان: پاس شد. تست داده واقعی و باگ‌های احتمالی UI در اجرای مرحله ۶ نیز کنترل می‌شوند.

### مرحله 6: importer، seed و داده Excel

وضعیت: `IN_PROGRESS`

اقدامات:

- جداسازی importer کتابی و مبحثی یا ایجاد orchestration شفاف برای هر دو.
- validation ردیف‌ها، consistency نوع ارزیابی و page pairs.
- transaction و گزارش create/update/reactivate/error.
- همگام‌سازی scriptهای package.json و جلوگیری از seed ناخواسته production.
- بررسی ساختار واقعی `seed.xlsx` و `topic-seed.xlsx`.

معیار پایان:

- dry-run/validation هر دو فایل موفق باشد یا خطای داده دقیق گزارش شود.
- هیچ importer به فیلد legacy وابسته نباشد.
- scriptهای release و seed رفتار صریح و امن داشته باشند.

### مرحله 7: تست و کنترل کیفیت جامع

وضعیت: `PENDING`

اقدامات:

- افزودن/اصلاح unit و integration test برای eligibility، ownership، mode separation و page pairs.
- تست رفتار Super Admin و picker در حد امکانات پروژه.
- اجرای Prisma validate/generate، TypeScript، ESLint، Vitest و build.
- تفکیک شکست‌های نامرتبط OTP/SMS از Curriculum و رفع فقط تداخل‌های ضروری.

معیار پایان:

- تمام تست‌های Curriculum پاس شوند.
- `tsc --noEmit`، ESLint و build بدون خطای Curriculum باشند.
- هر مانع محیطی یا نامرتبط با مدرک ثبت شده باشد.

### مرحله 8: بازبینی نهایی و آماده‌سازی تحویل

وضعیت: `PENDING`

اقدامات:

- بازبینی diff برای regression، امنیت، data loss و scope creep.
- جست‌وجوی نهایی legacy references و endpointهای مرده.
- `git diff --check` و ثبت status نهایی.
- به‌روزرسانی این فایل با نتیجه نهایی، caveatها و عملیات deploy.

معیار پایان:

- تمام معیارهای بخش 8 پاس یا با caveat صریح پذیرفته شده باشند.
- هیچ مرحله `IN_PROGRESS` یا gap بدون مالک باقی نماند.
- ترتیب deploy شامل migration، release و verification روشن باشد.

## 6. ترتیب وابستگی‌ها

```text
مرحله 1 (ممیزی)
  -> مرحله 2 (قرارداد DB)
  -> مرحله 3 (API مدیریت Curriculum)
  -> مرحله 4 (Task contract و client types)
  -> مرحله 5 (Super Admin نهایی)
  -> مرحله 6 (Importer/seed)
  -> مرحله 7 (QA جامع)
  -> مرحله 8 (تحویل)
```

تغییرات UI موجود پیش از مرحله 5 حفظ می‌شوند، اما نهایی‌شدن آن‌ها وابسته به قرارداد DB و API مراحل 2 تا 4 است.

## 7. رجیستر ریسک

| شناسه | ریسک | شدت | راه کنترل | وضعیت |
|---|---|---|---|---|
| R1 | migration فعلی `isFinal=true` را برای تمام GradeSubjectهای موجود حدس می‌زند | بالا | baseline greenfield جایگزین شد و backfill حذف شد | بسته |
| R2 | TopicModeهای legacy با `gradeSubjectId=null` باقی می‌مانند | بالا | gradeSubjectId در schema greenfield اجباری شد | بسته |
| R3 | تغییرات هم‌زمان OTP/SMS باعث شکست QA کامل می‌شوند | متوسط | اعتبارسنجی scoped و ثبت شکست نامرتبط | باز |
| R4 | worktree شامل تغییرات چند عامل است | بالا | عدم revert و بازخوانی فایل پیش از هر patch | فعال |
| R5 | قرارداد nullable page range با متن معماری قبلی درباره open-ended ناسازگار است | بالا | قرارداد قطعی pair-or-null در این runbook | بسته |
| R6 | soft delete با unique numbering مانع استفاده مجدد از شماره می‌شود | متوسط | reactivation کنترل‌شده یا تخصیص شماره بعدی | باز |

## 8. معیار پذیرش نهایی

- [ ] Subject-level `isKonkur` از قرارداد زنده حذف شده است.
- [ ] `GradeSubject.isKonkur/isFinal` در DB، API، UI و task validation یکسان‌اند.
- [ ] هیچ `isLastPage` در کد اجرایی، schema، importer و types باقی نیست.
- [ ] page range در تمام لایه‌ها pair-or-null و `start <= end` است.
- [ ] TopicMode CRUD فقط grade-scoped است.
- [ ] TopicModeSubtopic CRUD nested، ownership-safe و soft-delete است.
- [ ] Task در حالت BOOK و THEMATIC داده متناقض نمی‌پذیرد.
- [ ] create، batch و update تسک validation یکسان دارند.
- [ ] picker دانش‌آموز و مشاور eligibility صحیح را نمایش می‌دهد.
- [ ] Super Admin هر دو ساختار را persist و پس از refresh بازیابی می‌کند.
- [ ] importer کتابی و مبحثی transactional و validate-first است.
- [ ] migration برای داده فعلی و production غیرمخرب است.
- [ ] Prisma validate/generate، TypeScript، ESLint، tests و build پاس شده‌اند.
- [ ] جست‌وجوی legacy references نتیجه اجرایی ندارد.

## 9. گزارش اجرای مرحله 1

وضعیت: `COMPLETED`

زمان شروع: `2026-08-13 17:51 +03:30`

مرحله ۱ با ثبت inventory، قرارداد نهایی، baseline ابزارها، ساختار Excel، gapهای اولویت‌دار و تصمیم‌های migration تکمیل شد. هیچ فایل اجرایی در این مرحله تغییر نکرد؛ تنها این runbook ایجاد و به‌روزرسانی شد.

## 10. تاریخچه به‌روزرسانی

| زمان | مرحله | تغییر |
|---|---|---|
| 2026-08-13 17:51 +03:30 | 1 | ایجاد runbook و آغاز ممیزی خط مبنا |
| 2026-08-13 17:56 +03:30 | 1 | تکمیل baseline، ثبت gapها و تثبیت قرارداد مرحله ۲ |
| 2026-08-13 18:01 +03:30 | 2 | آغاز نهایی‌سازی schema و migration امن داده |
| 2026-08-13 18:20 +03:30 | 2 | تغییر راهبرد به greenfield و حذف کامل compatibility/backfill |
| 2026-08-13 18:25 +03:30 | 2 | ساخت baseline واحد، reset دیتابیس و تکمیل مرحله ۲ بدون drift |
| 2026-08-13 18:27 +03:30 | 3 | آغاز تکمیل APIهای canonical و حذف endpointهای legacy |
| 2026-08-13 18:54 +03:30 | 3 | تکمیل CRUD nested، ownership، soft delete و smoke test مرحله ۳ |
| 2026-08-13 19:16 +03:30 | 4 | تکمیل validator مرکزی task، types، picker، analytics و smoke test BOOK/THEMATIC |
| 2026-08-13 19:26 +03:30 | 5 | آغاز یکپارچه‌سازی Super Admin UI با قرارداد canonical |
| 2026-08-13 19:36 +03:30 | 5 | تکمیل Super Admin UI و ثبت ادامه تست داده واقعی در مرحله ۶ |
| 2026-08-13 19:36 +03:30 | 6 | آغاز importerهای greenfield کتابی و مبحثی |
| 2026-08-13 18:56 +03:30 | 4 | آغاز همگام‌سازی types و task flows |
