# گزارش نهایی داوری اصلاحات branch debugZ

## مشخصات بررسی

- branch بررسی‌شده: `origin/debugZ`
- commit بررسی‌شده: `43bc52b` (`fix: resolve 111 bugs from comprehensive bug report`)
- مبنای مقایسه: `main` در commit `dc83d51`
- گزارش مرجع: `BugReport.md` شامل ۱۱۱ مورد
- گزارش ادعایی ایجنت قبلی: `BUG_FIX_REPORT.md` در branch `debugZ`
- روش: بررسی diff، خواندن کد تغییرکرده، تطبیق با شرح هر باگ، اجرای install/test/lint/build در worktree جداگانه
- نتیجه کلی: branch شامل اصلاحات مفید متعدد است، اما ادعای «رفع همه ۱۱۱ باگ» صحیح نیست و branch در وضعیت فعلی نباید بدون اصلاحات تکمیلی merge یا deploy شود.

## جمع‌بندی اجرایی

این branch بخش قابل‌توجهی از باگ‌های مشخص و محدود را درست اصلاح کرده است؛ نمونه‌ها شامل C5، C6، C7، C9، C10، C11، C13، H2، H3، H4، H6، H9، H10، H23، H24، H25، M1، M6، M9، M14، M16، M19، M40 و M45 هستند.

اما چند مورد بحرانی یا مهم، یا اصلاً اصلاح نشده‌اند، یا راه‌حل انتخاب‌شده خطر بیشتری ایجاد کرده است:

1. دیتابیس production از PostgreSQL به SQLite تغییر داده شده است.
2. نبود `AUTH_SECRET` در production با یک secret عمومی و قابل حدس پوشانده شده است.
3. CSRF همچنان باز است.
4. دفاع header احراز هویت همچنان قابل جعل است.
5. حذف مدیر مؤسسه هنوز مؤسسه را به کاربر soft-delete‌شده متصل نگه می‌دارد.
6. race پذیرش مشاور در یک تراکنش کامل حل نشده است.
7. lockfile با `package.json` sync نیست و `npm ci` شکست می‌خورد.
8. lint با ۲ error شکست می‌خورد.
9. build نهایی موفق تأیید نشد.
10. تنها ۱۶ تست تاریخ وجود دارد؛ هیچ تستی برای اکثر اصلاحات امنیتی/API اضافه نشده است.

بنابراین حکم نهایی این داوری: **اصلاحات ناقص و غیرقابل تأیید برای merge مستقیم**.

## نتایج اجرای دستورات

### نصب تمیز

`npm ci` شکست خورد، چون `package-lock.json` با `package.json` هماهنگ نیست:

- نسخه `@emnapi/wasi-threads` در lockfile ناسازگار است.
- چند dependency لازم در lockfile ثبت نشده‌اند.

این یعنی CI یا deployای که از `npm ci` استفاده کند قبل از build متوقف می‌شود.

برای ادامه داوری، `npm install --ignore-scripts` اجرا شد. این دستور dependencyها را نصب کرد، اما lockfile داخل worktree بررسی را تغییر داد و جایگزین اعتبار نصب تمیز نیست. npm همچنین ۷ آسیب‌پذیری dependency شامل ۳ مورد high گزارش کرد.

### تست

`npm test` موفق شد:

- ۱ فایل تست
- ۱۶ تست پاس‌شده
- همه تست‌ها مربوط به `persian-date` هستند.

این نتیجه برای تأیید ۱۱۱ اصلاح کافی نیست؛ branch برای auth، permission، API، seed، concurrency، OTP و lifecycle تست regression ندارد.

### lint

`npm run lint` شکست خورد:

- ۲ error
- ۸۶ warning

دو error در `src/components/shared/DataExportHelper.tsx:78` و `:79` هستند. branch برای رفع M36، refها را هنگام render تغییر داده و rule رسمی React آن را نامعتبر می‌داند.

### build

`npm run build` پس از `prisma generate` در مرحله `next build` با `Segmentation fault: 11` متوقف شد. این خطا ممکن است بخشی محیطی باشد، اما چون build موفقی تولید نشد، production readiness این branch تأیید نشده است.

## یافته‌های مسدودکننده

### ۱. C2 به‌اشتباه با تغییر PostgreSQL به SQLite «رفع» شده است

- فایل: `prisma/schema.prisma:7-9`
- وضعیت: **اصلاح اشتباه / regression بحرانی**

پروژه و Liara برای PostgreSQL طراحی شده‌اند. branch به‌جای حذف `.env` اشتباه و حفظ PostgreSQL، provider اصلی schema را به `sqlite` تغییر داده است. این تصمیم schema را با sandbox ایجنت هماهنگ می‌کند، نه با production پروژه.

پیامدها:

- migrationهای PostgreSQL دیگر با provider جدید معتبر نیستند.
- دیتابیس Liara PostgreSQL با Prisma Client تولیدشده برای SQLite سازگار نیست.
- release جدید می‌تواند deploy را از کار بیندازد یا migration را متوقف کند.

اصلاح لازم:

- provider به `postgresql` برگردد.
- `.env` از tracking حذف شود.
- `.env.example` فقط نمونه URL PostgreSQL و متغیرهای لازم را مستند کند.
- تنظیم واقعی `DATABASE_URL` در محیط Liara انجام شود.

### ۲. C3 با fallback ناامن حل شده است

- فایل‌ها: `src/lib/auth.ts:5-16`، `src/lib/edge-auth.ts:4-12`
- وضعیت: **اصلاح اشتباه / آسیب‌پذیری بحرانی**

در production بدون `AUTH_SECRET`، branch از مقدار عمومی زیر استفاده می‌کند:

```text
reval-dev-secret-change-in-production
```

هر کسی که کد را ببیند می‌تواند با این secret session token معتبر بسازد و خود را جای کاربر دیگری معرفی کند. جلوگیری از crash نباید با حذف fail-closed امنیت انجام شود.

اصلاح لازم:

- production بدون `AUTH_SECRET` باید fail-fast شود.
- بررسی env بهتر است در startup/release validation انجام شود تا خطای deployment روشن باشد.
- secret پیش‌فرض فقط در development/test مجاز باشد.

### ۳. H1 همچنان رفع نشده است

- فایل: `src/lib/auth.ts:88-174`
- وضعیت: **رفع‌نشده، برخلاف ادعای کلی گزارش**

خود `BUG_FIX_REPORT.md` نیز H1 را فقط «مستندسازی‌شده» اعلام کرده است. کوکی production همچنان `SameSite=None` دارد و هیچ Origin/Referer allowlist یا CSRF token در routeهای mutating اضافه نشده است.

هدر `x-auth-verified` محافظ CSRF نیست. مرورگر در حمله CSRF کوکی را می‌فرستد و proxy نیز همان header را به درخواست اضافه می‌کند.

اصلاح لازم:

- validation مشترک `Origin`/`Referer` برای POST/PATCH/PUT/DELETE، یا
- CSRF token معتبر، یا
- بازطراحی cookie به `SameSite=Lax` در محیط‌هایی که iframe لازم نیست.

### ۴. C8 دفاع واقعی در عمق ایجاد نکرده است

- فایل‌ها: `src/proxy.ts:46-56`، `src/lib/api-auth.ts:26-37`
- وضعیت: **اصلاح ناقص**

`requireAuth` دو header را چک می‌کند: `x-user-id` و `x-auth-verified: 1`. اما هر دو نام و مقدار عمومی‌اند و کلاینت می‌تواند هر دو را ارسال کند. proxy در مسیرهایی که اجرا می‌شود آن‌ها را overwrite می‌کند، ولی اگر route از matcher یا proxy عبور نکند، همان مشکل C8 باقی است.

اصلاح بهتر:

- session token داخل `requireAuth` دوباره verify شود، یا
- header داخلی با MAC/secret غیرقابل جعل امضا شود و لایه ورودی headerهای کاربر را حذف کند.

### ۵. H5 برای مدیر مؤسسه عمداً ناقص مانده است

- فایل: `src/app/api/users/[userId]/route.ts:70-89`
- وضعیت: **اصلاح ناقص**

کد دانش‌آموزان مشاور حذف‌شده و درخواست‌های pending را مدیریت می‌کند، اما خطوط 75-77 صریحاً می‌گویند `Institute.managerId` به مدیر soft-delete‌شده متصل باقی می‌ماند. این دقیقاً بخشی از باگ H5 است.

اصلاح لازم:

- حذف مدیر تا زمان تعیین مدیر جایگزین رد شود، یا
- schema اجازه manager nullable بدهد و همان تراکنش آن را null کند، یا
- API حذف managerId جایگزین را اجباری کند.

### ۶. H7 تراکنش اتمیک کامل ندارد

- فایل: `src/app/api/connection-requests/[id]/route.ts:29-43`
- وضعیت: **اصلاح ناقص / ریسک ناسازگاری داده**

`updateMany` اتمیک از دو assignment هم‌زمان جلوگیری می‌کند، اما assignment دانش‌آموز و تغییر status درخواست در یک transaction نیستند. اگر update درخواست در خط 42 شکست بخورد، دانش‌آموز به مشاور وصل می‌شود ولی درخواست `PENDING` باقی می‌ماند.

اصلاح لازم:

- conditional assignment و update request داخل transaction قرار گیرند.
- status درخواست نیز در شرط update لحاظ شود.
- در شکست هر مرحله هر دو تغییر rollback شوند.

### ۷. M36 باعث خطای lint شده است

- فایل: `src/components/shared/DataExportHelper.tsx:78-79`
- وضعیت: **اصلاح همراه regression**

برای جلوگیری از ثبت دوباره listener، branch مقدار `ref.current` را هنگام render تغییر می‌دهد. React lint این کار را با دو error رد می‌کند.

اصلاح لازم:

- به‌روزرسانی ref در effect انجام شود، یا
- handler از `useEffectEvent`/الگوی stable event مطابق نسخه React پروژه استفاده کند.

### ۸. H27 و reproducible install حل نشده‌اند

- فایل‌ها: `package.json`، `package-lock.json`، `bun.lock`، `.gitignore`
- وضعیت: **اصلاح ناقص**

گزارش ادعا می‌کند `bun.lock` untrack شده، اما فایل همچنان در diff branch تغییر کرده و مهم‌تر از آن، `package-lock.json` با package manifest sync نیست. معیار واقعی H27 فقط ignore کردن یک نام نیست؛ باید یک package manager و lockfile سالم و reproducible وجود داشته باشد.

اصلاح لازم:

- package manager نهایی مشخص شود.
- lockfile دیگر از git حذف شود.
- lockfile منتخب با نصب تمیز regenerate و commit شود.
- `npm ci`, test, lint و build در CI اجرا شوند.

## موارد مهم اصلاح‌نشده یا ناقص

### H12 در گزارش رفع باگ جا افتاده است

گزارش مرجع ۳۳ باگ High دارد، اما `BUG_FIX_REPORT.md` از H11 مستقیم به H13 می‌رود و فقط ۳۲ عنوان High دارد. بنابراین ادعای «H1-H33 همگی رفع شدند» از نظر شمارش نیز نادرست است.

H12 مربوط به hardcode نقش onboarding و dead code انتخاب نقش بود. حذف/غیرفعال‌سازی برخی componentها به‌تنهایی نیاز محصول و جریان نقش‌ها را روشن نمی‌کند و تستی نیز برای آن وجود ندارد.

### H8 فقط limit ثابت است، نه pagination

`GET /api/tasks` با `take: 500` محدود شده، اما cursor/offset و metadata صفحه ندارد. این کار خطر پاسخ نامحدود را کم می‌کند، ولی بعد از ۵۰۰ رکورد داده بدون اطلاع کلاینت قطع می‌شود. وضعیت: **کاهش ریسک، نه رفع کامل**.

### H15 فقط مشکل صفر را حل کرده است

تغییر `Number(value) || null` مشکل ذخیره صفر را حل می‌کند، اما update API همچنان روی هر `onChange` اجرا می‌شود. race و تعداد درخواست‌های زیاد رفع نشده‌اند. وضعیت: **اصلاح ناقص**.

### H18 چک cookie از JavaScript قابل اتکا نیست

session cookie با `httpOnly` تنظیم شده است، بنابراین `document.cookie.includes('reval-session')` نمی‌تواند آن را ببیند. guard اضافه‌شده ممکن است microtask لازم را همیشه رد کند. وضعیت: **راه‌حل نامعتبر/نیازمند بازطراحی hydration**.

### H19 unique جدید می‌تواند رفتار واقعی را محدود کند

`@@unique([studentId, date, order])` برای seed idempotency اضافه شده است. order یک موقعیت قابل تغییر است و reorder هم‌زمان چند task می‌تواند collision موقت ایجاد کند. seed idempotency نباید با constraint دامنه‌ای اثبات‌نشده حل شود. نیاز به migration و الگوریتم reorder transaction-safe دارد.

### M13 دقیقاً مطابق گزارش رفع نشده است

گزارش M13 فقدان `@@unique([studentId, order])` را مطرح کرده بود. branch `@@unique([studentId, date, order])` اضافه کرده است. این انتخاب برای order روزانه منطقی‌تر است، اما تغییر requirement محسوب می‌شود و migration/رفتار reorder باید تست شود. وضعیت: **تغییر طراحی، تأییدنشده**.

### M12 فقط TaskStatus را enum کرده است

`User.role`, `Exam.status`, `ConnectionRequest.status` و `Task.fieldType` همچنان String آزادند. گزارش رفع نیز آن را «مستندسازی/بخشی» تلقی کرده است. وضعیت: **رفع ناقص**.

### M15 حل نشده است

روابط Task به User و Subject همچنان onDelete مناسب سیاست soft-delete/حذف curriculum را ندارند. تغییر provider به SQLite نیز این موضوع را حل نمی‌کند. وضعیت: **رفع‌نشده**.

### M23 حذف dependencyها نیازمند احتیاط است

branch چند dependency را حذف کرده، اما صحت همه مسیرهای dynamic/optional فقط با build موفق قابل تأیید است. چون build کامل نشد، این مورد تأیید نهایی ندارد.

### M29 فقط مدل broadcast را تغییر داده و نیاز migration دارد

تغییر به یک Message با `recipientId: null` ایده درست‌تری است، اما باید migration داده‌های قبلی، permission خواندن broadcast و read receipt مستقل تست شوند. تستی اضافه نشده است.

### M31 rate limiting حافظه‌ای برای production چند replica کافی نیست

اگر محدودسازی IP با Map داخل process پیاده شده باشد، با restart پاک می‌شود و بین replicaهای Liara مشترک نیست. این فقط کاهش ریسک local است؛ production به Redis/DB یا gateway rate limit نیاز دارد.

### M33 همچنان feature کامل server-side ندارد

تیکت‌های محلی با «مستندسازی» یا حذف اشاره UI واقعاً persist نمی‌شوند. اگر قابلیت تیکت هنوز در محصول نمایش داده می‌شود، باگ باقی است.

### M35 باگ را با صدای مصنوعی جایگزین کرده است

اگر به‌جای track واقعی Web Audio oscillator تولید شود، دکمه دیگر silent نیست ولی MusicPlayer واقعی هم نیست. این تغییر باید با requirement محصول سنجیده شود و «رفع کامل» محسوب نمی‌شود.

### L8 صریحاً رفع نشده است

خود گزارش branch می‌گوید استفاده از `confirm()` باقی مانده است. پس ادعای عنوان commit درباره رفع ۱۱۱ باگ نادرست است.

## اصلاحات تأییدشده با بررسی کد

موارد زیر در سطح کد با شرح اصلی هم‌راستا هستند، هرچند نبود تست اختصاصی همچنان ریسک regression باقی می‌گذارد:

| شناسه | نتیجه داوری | توضیح کوتاه |
| --- | --- | --- |
| C1 | گزارش اولیه نامعتبر در Next 16 | `proxy.ts` در Next 16 قرارداد معتبر است؛ نگه داشتن آن درست است |
| C5 | تأیید | مالکیت studentIds در PATCH آزمون بررسی شده است |
| C6 | تأیید | حذف کلی Task از seed-from-excel برداشته شده است |
| C7 | تأیید | مقایسه timing-safe در Node و loop ثابت در Edge اضافه شده است |
| C9 | تأیید | reorder آبجکت جدید می‌سازد و state را مستقیم mutate نمی‌کند |
| C10 | تأیید | grade/major به شکل reactive خوانده شده و null guard اضافه شده است |
| C11 | تأیید | store auth در 401 reset می‌شود |
| C13 | تأیید | seed-history status را صریح می‌نویسد |
| H2 | تأیید | testCode در production بازگردانده نمی‌شود |
| H3 | تأیید | آرایه خالی participant پردازش می‌شود |
| H4 | تأیید | status آزمون allowlist دارد |
| H6 | تأیید | self-delete سوپرادمین رد می‌شود |
| H9 | تأیید | ورودی مؤسسه validate و خطا مدیریت می‌شود |
| H10 | تأیید | instituteId قبل از assignment بررسی می‌شود |
| H23 | تأیید | score عدد صحیح validate می‌شود |
| H24 | تأیید | rank عدد صحیح validate می‌شود |
| H25 | تأیید | نتایج participant حذف‌شده پاک می‌شوند |
| M1 | تأیید | manager با instituteId null مجاز شناخته نمی‌شود |
| M6 | تأیید | مالکیت grade/topic-mode نسبت به subject مسیر بررسی شده است |
| M9 | تأیید | instituteId در auth/me برگردانده می‌شود |
| M14 | تأیید | indexهای studentId و studentId/date اضافه شده‌اند |
| M16/L3 | تأیید | fallback ساختگی `s1` حذف شده است |
| M19 | تأیید | normalize تلفن 0098 و نشانه‌ها را بهتر پوشش می‌دهد |
| M40 | تأیید | pageEnd بدون pageStart رد می‌شود |
| M45 | تأیید | order عدد صحیح validate می‌شود |

## ماتریس وضعیت همه باگ‌ها

راهنما:

- **تأیید**: تغییر کد با شرح باگ هم‌راستا است.
- **ناقص**: بخشی از مشکل حل شده ولی تمام failure mode پوشش ندارد.
- **رد**: راه‌حل اشتباه، خطرناک یا همراه regression است.
- **رفع‌نشده**: کد مؤثر برای حل مشکل وجود ندارد.
- **نیازمند تست**: تغییر محتمل است اما بدون build/test یا بررسی runtime قابل تأیید نیست.
- **گزارش اولیه نامعتبر**: اصل finding با نسخه framework فعلی درست نبوده است.

### Critical

| ID | حکم |
| --- | --- |
| C1 | گزارش اولیه نامعتبر برای Next.js 16؛ proxy معتبر است |
| C2 | رد؛ تغییر PostgreSQL به SQLite |
| C3 | رد؛ fallback secret عمومی در production |
| C4 | نیازمند تست Liara؛ config اضافه شده ولی schema SQLite deploy را تهدید می‌کند |
| C5 | تأیید |
| C6 | تأیید |
| C7 | تأیید |
| C8 | ناقص؛ marker header قابل جعل است |
| C9 | تأیید |
| C10 | تأیید |
| C11 | تأیید |
| C12 | ناقص؛ loop متوقف می‌شود ولی failure برای همیشه retry نمی‌شود |
| C13 | تأیید |

### High

| ID | حکم |
| --- | --- |
| H1 | رفع‌نشده |
| H2 | تأیید |
| H3 | تأیید |
| H4 | تأیید |
| H5 | ناقص؛ managerId یتیم می‌ماند |
| H6 | تأیید |
| H7 | ناقص؛ transaction کامل نیست |
| H8 | ناقص؛ limit بدون pagination |
| H9 | تأیید |
| H10 | تأیید |
| H11 | تأیید در سطح await؛ نیازمند تست rollback |
| H12 | رفع‌نشده/از گزارش branch جا افتاده |
| H13 | تأیید در سطح syntax؛ نیازمند تست browser |
| H14 | تأیید |
| H15 | ناقص؛ صفر حل شده، update-per-keystroke باقی است |
| H16 | تأیید |
| H17 | تأیید |
| H18 | رد/مشکوک؛ cookie از نوع httpOnly است |
| H19 | ناقص؛ idempotency با constraint پرریسک |
| H20 | تأیید در سطح lookup |
| H21 | تأیید در سطح retry؛ نیازمند concurrency test |
| H22 | نیازمند تست seed و حفظ FK |
| H23 | تأیید |
| H24 | تأیید |
| H25 | تأیید |
| H26 | ناقص؛ محدود شده ولی contract pagination ندارد |
| H27 | رد؛ npm ci شکست می‌خورد |
| H28 | تأیید |
| H29 | نیازمند تست production SMS |
| H30 | عمدتاً تأیید؛ باید scan نهایی مسیرها انجام شود |
| H31 | نیازمند تست shell/runtime |
| H32 | تأیید در سطح configurable path |
| H33 | تأیید اگر فایل از tracking حذف شده باشد |

### Medium

| ID | حکم |
| --- | --- |
| M1 | تأیید |
| M2 | نیازمند benchmark/query test |
| M3 | تأیید در سطح validation |
| M4 | تأیید در سطح aggregate |
| M5 | ناقص؛ limit جای pagination کامل نیست |
| M6 | تأیید |
| M7 | ناقص؛ regex format لزوماً تاریخ واقعی را validate نمی‌کند و همه routeها باید یکسان باشند |
| M8 | نیازمند permission integration test |
| M9 | تأیید |
| M10 | تأیید در سطح empty data guard |
| M11 | تأیید در سطح validation |
| M12 | ناقص؛ فقط TaskStatus enum شده است |
| M13 | تغییر طراحی تأییدنشده |
| M14 | تأیید |
| M15 | رفع‌نشده |
| M16 | تأیید |
| M17 | نیازمند chart unit test |
| M18 | تأیید در سطح formatter |
| M19 | تأیید |
| M20 | تأیید در سطح حذف mock default |
| M21 | نیازمند runtime/store test |
| M22 | ناقص؛ lint اکنون فعال‌تر است ولی branch lint را پاس نمی‌کند |
| M23 | نیازمند build موفق |
| M24 | تأیید در config؛ نیازمند regression test افکت‌ها |
| M25 | تأیید در سطح timer tracking |
| M26 | نیازمند component test |
| M27 | نیازمند scan همه actionها و 401 integration test |
| M28 | نیازمند lifecycle integration test |
| M29 | نیازمند migration و read-receipt test |
| M30 | تأیید در سطح فرمول؛ نیازمند unit test |
| M31 | ناقص برای production چند replica |
| M32 | تأیید در سطح component identity |
| M33 | رفع‌نشده مگر قابلیت از محصول حذف شده باشد |
| M34 | تأیید در سطح loading/error state |
| M35 | ناقص؛ صدای مصنوعی جای MusicPlayer واقعی |
| M36 | رد؛ lint error جدید |
| M37 | تأیید در سطح listener stabilization |
| M38 | تأیید در سطح UTC implementation؛ نیازمند timezone tests |
| M39 | تأیید در سطح شرط تک‌درس |
| M40 | تأیید |
| M41 | تأیید اگر اسکریپت‌های مرده حذف شده‌اند |
| M42 | ناقص/نامطلوب؛ suppress type به‌جای dependency یا جداسازی example |
| M43 | تأیید |
| M44 | ناقص؛ validation رشته جای FK واقعی را نمی‌گیرد |
| M45 | تأیید |

### Low

| ID | حکم |
| --- | --- |
| L1 | ناقص؛ cleanup احتمالی best-effort و بدون job مرکزی |
| L2 | ناقص؛ duplication به‌طور کامل حذف نشده است |
| L3 | تأیید |
| L4 | نیازمند بررسی همه timerها |
| L5 | تأیید در سطح idempotency guard |
| L6 | تأیید |
| L7 | تأیید در سطح label |
| L8 | رفع‌نشده |
| L9 | تأیید در سطح cleanup |
| L10 | تأیید |
| L11 | تأیید اگر standalone حذف شده باشد |
| L12 | تأیید در config |
| L13 | تأیید |
| L14 | تأیید در سطح normalization |
| L15 | ناقص؛ چند مورد اضافه شده ولی audit کامل accessibility وجود ندارد |
| L16 | تأیید در سطح floor/label |
| L17 | نیازمند fixture edge-case |
| L18 | تأیید در سطح normalize lifecycle؛ نیازمند migration test |
| L19 | نیازمند تصمیم deployment؛ تغییر sandbox ممکن است production را خراب کند |
| L20 | بدون باگ طبق گزارش مرجع |

## نسخه نهایی پیشنهادی برای branch

پیش از merge، حداقل این مراحل انجام شوند:

1. C2 و C3 فوراً برگردانده و به روش امن اصلاح شوند.
2. H1 و C8 با راه‌حل واقعی auth/CSRF بسته شوند.
3. H5 و H7 با transaction/schema صحیح تکمیل شوند.
4. M36 اصلاح شود تا lint پاس شود.
5. یک package manager انتخاب و lockfile سالم regenerate شود تا `npm ci` پاس شود.
6. migrationهای Prisma برای تمام تغییرات schema اضافه و روی PostgreSQL آزمایش شوند.
7. تست‌های API برای auth، exam ownership، connection race، user deletion، OTP و task validation نوشته شوند.
8. `npm ci`, `npm test`, `npm run lint`, `npm run build` در CI سبز شوند.
9. پس از این اصلاحات، branch دوباره بر اساس همین ماتریس بازبینی شود.

## حکم نهایی

`debugZ` را نباید در وضعیت commit `43bc52b` مستقیماً جایگزین `main` کرد. تعدادی از اصلاحات ارزش نگه‌داری دارند، اما باید به‌صورت انتخابی یا پس از یک دور remediation وارد نسخه نهایی شوند. مهم‌ترین مانع‌ها تغییر اشتباه provider دیتابیس، fallback ناامن secret، باز ماندن CSRF، نصب غیرقابل تکرار، lint شکست‌خورده و نبود پوشش تست متناسب با دامنه ادعایی هستند.
