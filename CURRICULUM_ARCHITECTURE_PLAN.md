# نقشه عملیاتی معماری نهایی دروس

## هدف

سیستم باید دو نوع ساختار آموزشی مستقل داشته باشد:

1. ساختار کتاب‌محور: درس ← پایه/رشته ← فصل ← گفتار، همراه با بازه صفحات.
2. ساختار مبحث‌محور: درس ← پایه/رشته ← مبحث اصلی ← زیرمبحث، بدون وابستگی به فصل یا صفحه.

هر دو ساختار باید در پنل سوپرادمین قابل مشاهده و ویرایش باشند و هنگام افزودن تسک، هم برای دانش‌آموز و هم برای مشاور، بر اساس نوع تسک فیلتر شوند.

## تصمیم‌های قطعی

### تفکیک کتاب‌محور و مبحث‌محور

این دو ساختار در Excel و دیتابیس جدا هستند. یک مبحث مستقل نباید به `Chapter`، `Topic`، شماره صفحه یا بازه صفحات متصل شود.

- `seed.xlsx`: فقط داده کتاب، فصل، گفتار و صفحات.
- `topic-seed.xlsx`: فقط مبحث اصلی و زیرمبحث.

### حذف فیلدهای «تا پایان»

فیلدهای زیر از Excel و schema حذف شوند:

- `chapterIsLastPage` / «فصل تا پایان کتاب؟»
- `topicIsLastPage` / «گفتار تا پایان فصل؟»

فیلدهای `pageStart` و `pageEnd` باقی بمانند و nullable باشند. مقدار خالی یعنی انتهای باز یا نامشخص؛ منطق صفحه‌یابی نباید به boolean جداگانه وابسته باشد. هر جا نیاز به انتهای باز وجود دارد، با `pageEnd IS NULL` بررسی شود.

### نوع ارزیابی

وضعیت کنکور/نهایی ویژگی ترکیب درس، پایه و رشته است، نه فقط نام درس. برای جلوگیری از حالت‌های مبهم، در دیتابیس دو flag مستقل روی pivot پایه/رشته ذخیره شود:

```text
isKonkur: Boolean
isFinal: Boolean
```

نگاشت Excel:

| مقدار `نوع ارزیابی` | `isKonkur` | `isFinal` |
|---|---:|---:|
| `کنکور` | true | false |
| `نهایی` | false | true |
| `هر دو` | true | true |

مقدار خالی، مقدار ناشناخته و مقدار `false/false` برای import معتبر نیست و باید با گزارش ردیف خطادار متوقف شود.

## فایل‌های Excel

### `seed.xlsx`

این فایل فقط یک شیت `Data` دارد و برای ساختار کتاب‌محور است:

```text
نام درس
پایه
رشته
نوع ارزیابی
شماره فصل
نام فصل
شروع صفحه فصل
پایان صفحه فصل
شماره گفتار
نام گفتار
شروع صفحه گفتار
پایان صفحه گفتار
رنگ درس
ترتیب درس
فعال؟
یادداشت
```

قواعد:

- نام درس فارسی و همان مقدار نمایشی سایت است.
- هر ردیف یک گفتار است؛ اطلاعات فصل در ردیف‌های گفتار تکرار می‌شود.
- اگر فصل گفتار ندارد، ستون‌های گفتار خالی باشند.
- ستون‌های «تا پایان کتاب» و «تا پایان فصل» وجود ندارند.
- `نوع ارزیابی` یکی از `کنکور`، `نهایی` یا `هر دو` است.
- داده‌های یک ترکیب درس/پایه/رشته باید یک نوع ارزیابی یکسان داشته باشند.

### `topic-seed.xlsx`

این فایل مستقل از `seed.xlsx` است و یک شیت `Data` برای مبحث‌محور دارد:

```text
نام درس
پایه
رشته
نوع ارزیابی
شماره مبحث
نام مبحث
شماره زیرمبحث
نام زیرمبحث
فعال؟
یادداشت
```

قواعد:

- هر ردیف یک زیرمبحث است.
- برای مبحثی که زیرمبحث ندارد، `شماره زیرمبحث` و `نام زیرمبحث` خالی بماند.
- هیچ ستون صفحه، فصل یا گفتار در این فایل وجود ندارد.
- مباحث نمونه مانند تابع، مثلثات، هندسه، استوکیومتری و اسید و باز فقط نمونه قالب هستند و باید با داده واقعی تکمیل یا اصلاح شوند.
- مشخصات درس/پایه/رشته/نوع ارزیابی در هر ردیف تکرار شود.

## طراحی schema پیشنهادی

### `Subject`

`Subject` منبع نام فارسی، رنگ، ترتیب و فعال/غیرفعال بودن کلی درس باقی بماند. فیلد `isKonkur` از این مدل حذف شود، چون وضعیت ارزیابی در سطح ترکیب پایه/رشته تعریف می‌شود.

### `GradeSubject`

به pivot موجود این فیلدها اضافه شود:

```prisma
isKonkur Boolean @default(false)
isFinal  Boolean @default(false)
```

این رکورد نماینده‌ی «درس + پایه + رشته» است و ساختار کتابی آن، یعنی `Chapter[]`، به همین رکورد متصل می‌ماند.

### ساختار کتابی

مدل‌های موجود `Chapter` و `Topic` باقی بمانند، اما این فیلدها حذف شوند:

```prisma
isLastPage Boolean
```

`pageStart` و `pageEnd` nullable باقی بمانند. `pageEnd = null` انتهای باز یا داده نامشخص است و نباید به‌صورت خودکار به معنای «کل کتاب» تفسیر شود مگر در منطق مشخص صفحه‌یابی.

### ساختار مبحثی

مدل فعلی `TopicMode` باید از حالت عنوان مستقلِ متصل فقط به Subject خارج شود و به ترکیب پایه/رشته متصل شود:

```prisma
model TopicMode {
  id        String @id @default(cuid())
  subjectId String
  grade     String
  major     String
  title     String
  modeNo    Int
  sortOrder Int @default(0)
  isActive  Boolean @default(true)

  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  subtopics TopicModeSubtopic[]
  tasks     Task[]

  @@unique([subjectId, grade, major, modeNo])
}

model TopicModeSubtopic {
  id          String @id @default(cuid())
  topicModeId String
  title       String
  subtopicNo  Int
  sortOrder   Int @default(0)
  isActive    Boolean @default(true)

  topicMode TopicMode @relation(fields: [topicModeId], references: [id], onDelete: Cascade)
  tasks     TaskTopicModeSubtopic[]

  @@unique([topicModeId, subtopicNo])
}
```

برای اتصال چند زیرمبحث به یک تسک، رابطه‌ی واسط لازم است:

```prisma
model TaskTopicModeSubtopic {
  taskId              String
  topicModeSubtopicId String

  task              Task              @relation(fields: [taskId], references: [id], onDelete: Cascade)
  subtopic          TopicModeSubtopic @relation(fields: [topicModeSubtopicId], references: [id], onDelete: Cascade)

  @@id([taskId, topicModeSubtopicId])
}
```

به `Task` نیز `topicModeSubtopicId` در صورت نیاز برای primary selection و relation مجموعه‌ی `topicModeSubtopics` اضافه شود. `topicModeId` همچنان مبحث اصلی انتخاب‌شده را نگه می‌دارد.

## رفتار افزودن تسک

`TaskSubjectPicker` کامپوننت مشترک پنل دانش‌آموز و مشاور است و باید همان مسیر مشترک را حفظ کند.

بعد از انتخاب نوع تسک:

### حالت `کنکور`

- فقط `GradeSubject.isKonkur = true` نمایش داده شود.
- کاربر بتواند بین دو حالت «کتابی» و «مبحثی» انتخاب کند.
- در حالت کتابی: پایه ← فصل ← گفتار و صفحه نمایش داده شود.
- در حالت مبحثی: پایه ← مبحث اصلی ← زیرمبحث نمایش داده شود.
- در حالت مبحثی هیچ ورودی صفحه یا فصل نمایش داده نشود.

### حالت `نهایی`

- فقط `GradeSubject.isFinal = true` نمایش داده شود.
- ساختار کتابی با فصل/گفتار/صفحه نمایش داده شود.
- اگر داده مبحثی برای نهایی وجود داشته باشد، فقط در صورت تعریف صریح در `topic-seed.xlsx` قابل نمایش باشد.

### حالت `هر دو`

این مقدار در داده ذخیره نمی‌شود؛ در Excel فقط shorthand است و importer آن را به `true/true` تبدیل می‌کند. در UI، درس در هر دو نوع تسک دیده می‌شود.

### اعتبارسنجی API

فقط مخفی‌کردن گزینه در UI کافی نیست. APIهای `POST /api/tasks`، `POST /api/tasks/batch` و `PATCH /api/tasks/[taskId]` باید بررسی کنند:

- Subject و GradeSubject متعلق به هم هستند.
- `fieldType=کنکور` با `isKonkur=true` سازگار است.
- `fieldType=نهایی` با `isFinal=true` سازگار است.
- ساختار کتابی و مبحثی هم‌زمان انتخاب نشده‌اند.
- `topicMode` متعلق به همان subject/grade/major است.
- زیرمبحث‌های انتخاب‌شده متعلق به همان مبحث اصلی هستند.
- در حالت مبحثی هیچ chapter/topic کتابی پذیرفته نشود.

## importer و seed

دو importer مستقل اما هماهنگ پیاده‌سازی شود:

```text
prisma/seed-book-curriculum.ts
prisma/seed-topic-curriculum.ts
```

هر دو باید:

- transaction داشته باشند.
- قبل از تغییر، داده‌ها را validate کنند.
- خطا را همراه نام فایل، شماره شیت و شماره ردیف گزارش کنند.
- نام فارسی را در `Subject.name` ذخیره کنند.
- `Subject` را با نام normalize‌شده upsert کنند.
- `GradeSubject` را با unique ترکیب subject/grade/major upsert کنند.
- داده‌های نامربوط یا حذف‌شده در Excel را خودکار حذف نکنند؛ برای حذف از `isActive=false` استفاده شود.
- seed production فعلی کاربران و migrationها را اجرا نکنند.

فرمان‌های پیشنهادی:

```json
"db:seed:book": "tsx prisma/seed-book-curriculum.ts",
"db:seed:topics": "tsx prisma/seed-topic-curriculum.ts",
"db:seed:curriculum": "npm run db:seed:book && npm run db:seed:topics"
```

برای Liara، migration باید قبل از seed اجرا شود؛ seed داده‌ی curriculum را در startup اصلی اجرا نکند مگر به‌صورت release command کنترل‌شده.

## پنل سوپرادمین

پنل موجود قابل استفاده است اما برای مدل نهایی باید بازطراحی شود.

### نمای فهرست دروس

- جستجو و فیلتر بر اساس نام فارسی درس.
- نمایش وضعیت ارزیابی به شکل سه badge: فقط کنکور، فقط نهایی، هر دو.
- نمایش تعداد پایه/رشته‌های فعال.
- نمایش تعداد فصل/گفتار کتابی.
- نمایش تعداد مبحث/زیرمبحث مبحثی.
- امکان فعال/غیرفعال‌سازی درس بدون حذف داده.
- امکان افزودن درس فارسی جدید با رنگ، آیکن و ترتیب.

### نمای جزئیات درس

دو تب مستقل داشته باشد:

1. «ساختار کتابی»: انتخاب پایه و رشته، ویرایش فصل/گفتار/صفحه.
2. «ساختار مبحثی»: انتخاب پایه و رشته، ویرایش مبحث اصلی/زیرمبحث بدون فیلد صفحه.

در بالای هر دو تب، وضعیت `isKonkur` و `isFinal` همان GradeSubject با کنترل مشخص نمایش داده شود.

ویرایش مستقیم باید از API انجام شود، optimistic state بدون persistence مجاز نیست، و عملیات حذف باید soft delete یا پیام تأیید داشته باشد.

### import از Excel

یک ابزار import در سوپرادمین یا اسکریپت release اضافه شود که:

- فایل کتابی و مبحثی را جداگانه دریافت کند.
- قبل از اعمال، preview و خطاهای validation را نمایش دهد.
- تعداد ایجاد/به‌روزرسانی/غیرفعال‌سازی را گزارش کند.
- در صورت خطای validation هیچ بخشی از transaction را commit نکند.

## migration و داده‌های فعلی

ترتیب migration:

1. افزودن `GradeSubject.isKonkur` و `GradeSubject.isFinal` با مقدار پیش‌فرض `false`.
2. انتقال مقدار فعلی `Subject.isKonkur` به `GradeSubject.isKonkur` برای همه pivotهای فعال موجود.
3. تعیین `isFinal` بر اساس داده واقعی Excel؛ مقدار پیش‌فرض نباید بدون تأیید به همه‌ی درس‌ها داده شود.
4. حذف `Subject.isKonkur` پس از مهاجرت کامل API و UI.
5. حذف `Chapter.isLastPage` و `Topic.isLastPage` پس از حذف مصرف‌کننده‌های آن‌ها.
6. افزودن grade/major و زیرمبحث‌های `TopicMode`.
7. ایجاد relation واسط زیرمبحث مبحثی با Task.
8. backfill مبحث‌های قدیمی فقط در صورت نگاشت صریح؛ عنوان‌های قدیمی بدون نگاشت نباید حدس زده شوند.

هر migration باید با `prisma migrate deploy` روی Liara اجرا شود و نباید `migrate reset` یا حذف داده‌ی production استفاده شود.

## تست‌های پذیرش

### ارزیابی و افزودن تسک

- درس فقط کنکور در دکمه نهایی نمایش داده نمی‌شود.
- درس فقط نهایی در دکمه کنکور نمایش داده نمی‌شود.
- درس هر دو در هر دو دکمه نمایش داده می‌شود.
- انتخاب مبحثی فصل/صفحه را نمایش نمی‌دهد.
- انتخاب کتابی مبحث مستقل/زیرمبحث را نمایش نمی‌دهد.
- همین رفتار در پنل دانش‌آموز و مشاور یکسان است.
- دستکاری مستقیم API برای انتخاب نامعتبر با status `400` رد می‌شود.

### داده و پنل سوپرادمین

- import فایل کتابی ساختار فصل/گفتار را بدون ستون‌های تا پایان وارد می‌کند.
- import فایل مبحثی مبحث/زیرمبحث را بدون page/chapter وارد می‌کند.
- نام فارسی در API و UI نمایش داده می‌شود.
- ویرایش و غیرفعال‌سازی در پنل مستقیماً در دیتابیس باقی می‌ماند.
- refresh صفحه، تغییرات ذخیره‌شده را حفظ می‌کند.
- حذف/غیرفعال‌سازی با داده‌های مرتبط تسک‌ها رفتار امن و قابل مشاهده دارد.

## وضعیت فعلی فایل‌ها

- `seed.xlsx`: ساختار کتابی ساده‌شده، یک شیت `Data`، ۱۶ ستون.
- `topic-seed.xlsx`: ساختار مبحثی مستقل، شیت `Data` و `README`، ۱۰ ستون، دارای چند ردیف نمونه برای جایگزینی با داده واقعی.
- هنوز schema، importer، API و پنل سوپرادمین برای این نقشه تغییر نکرده‌اند؛ این فایل سند اجرای مرحله بعد است.

## معیار پایان اجرا

کار زمانی کامل است که Excel، schema، seed، API افزودن تسک و پنل سوپرادمین یک قرارداد واحد داشته باشند؛ هیچ مسیر قدیمی بر اساس `Subject.isKonkur` یا `TopicMode` بدون grade/major باقی نماند؛ و تمام تست‌های پذیرش بالا در هر دو نقش دانش‌آموز و مشاور موفق شوند.

## عملیات مستقل: ارائه‌دهنده چندگانه پیامک OTP

لایه OTP باید از provider مستقل باشد و با متغیر زیر انتخاب شود:

```text
SMS_PROVIDER=sandbox | sms_ir | arta
```

- `sandbox`: هیچ درخواست خارجی ارسال نمی‌کند و فقط در پاسخ محیط تست `testCode` برمی‌گرداند.
- `sms_ir`: تنظیمات فعلی `SMS_IR_API_KEY`، `SMS_IR_OTP_TEMPLATE_ID` و `SMS_IR_OTP_PARAMETER` را استفاده می‌کند.
- `arta`: endpoint پترن Arta/IPPanel را با `ARTA_SMS_API_TOKEN`، `ARTA_SMS_PATTERN_CODE`، `ARTA_SMS_FROM_NUMBER` و `ARTA_SMS_OTP_PARAMETER` استفاده می‌کند.
- secrets نباید در Git، فایل نقشه، log یا پاسخ API قرار بگیرند.
- شماره داخلی `09xxxxxxxxx` برای Arta به `+989xxxxxxxxx` تبدیل شود.
- OTP، cooldown، TTL، hash و تعداد تلاش مستقل از provider و مشترک باقی بماند.
- provider نامعتبر یا ناقص باید status `503` بدهد؛ خطای ارسال provider باید status `502` بدهد.
- برای دوره مهاجرت، نبود `SMS_PROVIDER` با `SMS_IR_MODE=sandbox` سازگار بماند و در غیر این صورت به SMS.ir برگردد.
- تست خودکار باید هر سه انتخاب، payload پترن Arta، تبدیل شماره و خطای config را پوشش دهد.
- در Liara فقط یکی از providerها با `SMS_PROVIDER` فعال می‌شود؛ تغییر provider نیازمند restart/deploy مجدد است.
