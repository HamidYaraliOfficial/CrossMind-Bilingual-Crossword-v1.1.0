# CrossMind — Bilingual Crossword Puzzle Game

**CrossMind (چهارراه)** is a responsive, browser-based crossword game with Persian and English interfaces. Players solve interlocking word grids by entering one character per cell, using short definitions and riddles as clues.

**Creator:** Hamid Yarali  
**Repository name suggestion:** `CrossMind-Bilingual-Crossword`

---

## فارسی

### معرفی

چهارراه یک بازی حل جدول واژگان است که در آن برای هر واژه، یک تعریف یا چیستان نمایش داده می‌شود و بازیکن باید پاسخ را حرف‌به‌حرف در خانه‌های جدول وارد کند. واژه‌ها به‌صورت افقی و عمودی با یکدیگر تقاطع دارند؛ بنابراین حروف مشترک، بخش مهمی از مسیر حل جدول هستند.

### امکانات

- رابط کاربری کامل فارسی و انگلیسی با تغییر جهت خودکار RTL/LTR.
- تولید تصادفی ۱۰۰ جدول متمایز در هر دور: ۳۴ جدول کوچک، ۳۳ جدول متوسط و ۳۳ جدول بزرگ.
- اندازه‌های متفاوت و تعداد واژه‌های متغیر: ۵ واژه در سطح کوچک، ۷ واژه در سطح متوسط و ۹ واژه در سطح بزرگ.
- قرارگیری واقعی واژه‌ها با تقاطع حروف مشترک؛ جدول صرفاً یک آرایش تصادفی از خانه‌ها نیست.
- رعایت جهت نوشتار راست‌به‌چپ برای پاسخ‌های افقی فارسی.
- بانک واژگان دوزبانه با موضوع‌های فناوری، دانش، طبیعت، جانوران، فرهنگ و اشیا.
- ورود حرف در هر خانه، حرکت خودکار بین خانه‌های یک واژه و پشتیبانی از کلیدهای جهت‌دار.
- انتخاب راهنمای افقی یا عمودی و انتخاب مستقیم هر راهنما.
- راهنمایی یک‌حرفی، بررسی پاسخ‌ها، نمایش پاسخ کامل و پاک‌کردن جدول.
- زمان‌سنج، درصد پیشرفت، امتیاز، صدای اختیاری و ثبت بهترین زمان.
- ذخیره دور فعلی، پاسخ‌های واردشده و تاریخچه اثرانگشت جدول‌ها در حافظه مرورگر (`localStorage`).
- طراحی واکنش‌گرا برای نمایشگر رایانه، تبلت و تلفن همراه.
- بدون نیاز به پایگاه داده، API یا نصب کتابخانه‌های جانبی.

### اجرا در ویندوز، لینوکس و macOS

**پیش‌نیاز:** Node.js نسخه ۱۸ یا بالاتر.

۱. مخزن را دریافت یا فایل ZIP را استخراج کنید.

۲. در پوشه پروژه ترمینال باز کنید و دستور زیر را اجرا کنید:

```bash
npm start
```

۳. نشانی زیر را در مرورگر باز کنید:

```text
http://localhost:4173
```

برای اجرای حالت توسعه نیز می‌توانید از `npm run dev` استفاده کنید. پروژه وابستگی خارجی ندارد و نیازی به اجرای `npm install` نیست.

### روش بازی

۱. زبان فارسی یا انگلیسی را از بالای صفحه انتخاب کنید.  
۲. اندازۀ جدول یا موضوع دلخواه را انتخاب کنید؛ گزینه تصادفی همواره در دسترس است.  
۳. یکی از راهنماهای افقی یا عمودی را انتخاب کنید.  
۴. خانه شروع واژه فعال می‌شود؛ پاسخ را حرف‌به‌حرف وارد کنید.  
۵. از «راهنمایی» برای آشکارشدن یک حرف یا از «بررسی پاسخ» برای کنترل خانه‌ها استفاده کنید.  
۶. با «جدول تازه» به یکی از جدول‌های استفاده‌نشده بروید.

### کلیدهای میان‌بر

| کلید | عملکرد |
|---|---|
| کلیدهای جهت‌دار | حرکت میان خانه‌های جدول |
| Backspace | پاک‌کردن حرف یا رفتن به خانه قبلی |
| Enter | بررسی پاسخ‌ها |
| H | دریافت یک راهنمایی |

### تولید جدول و جلوگیری از تکرار

موتور جدول‌ساز واژه‌ها را از بانک داده انتخاب می‌کند، محل برخورد حروف مشترک را می‌یابد و هر واژه را عمود بر واژۀ قبلی در جدول قرار می‌دهد. محل‌هایی که باعث برخورد حروف ناسازگار یا تماس غیرمجاز با واژه‌های دیگر شوند، رد می‌شوند. در پایان، جدول از روی مختصات واژه‌ها ساخته و شماره‌گذاری راهنماها به‌صورت خودکار انجام می‌شود.

هر دور شامل ۱۰۰ جدول با اثرانگشت محتوایی یکتا است. فهرست جدول‌های تولیدشده در `localStorage` نگهداری می‌شود تا در دورهای بعدی نیز از تولید همان ترکیب واژه‌ها جلوگیری شود. پاسخ‌های نیمه‌کاره و دور جاری نیز در همان مرورگر باقی می‌مانند.

### ساختار پروژه

```text
CrossMind/
├── index.html                 # صفحه اصلی و ساختار رابط کاربری
├── package.json               # فرمان‌های اجرای پروژه
├── server.mjs                 # وب‌سرور سبک Node.js بدون وابستگی
├── LICENSE.txt                # مجوز و اعلام حقوق مالکیت
├── README.md                  # راهنمای فارسی و انگلیسی
├── scripts/
│   └── verify-generator.mjs   # آزمون صحت موتور تولید جدول
└── src/
    ├── data.js                # بانک واژگان و متن‌های دوزبانه
    ├── crossword.js           # الگوریتم تولید و شماره‌گذاری جدول
    ├── main.js                # منطق بازی و تعاملات رابط کاربری
    └── styles.css             # طراحی واکنش‌گرا و پوسته بصری
```

### آزمون موتور تولید جدول

برای بررسی تولید ۱۰۰ جدول یکتا در هر زبان و اعتبارسنجی محل حروف، اجرا کنید:

```bash
npm test
```

خروجی موفق باید تعداد ۱۰۰ جدول فارسی و ۱۰۰ جدول انگلیسی را همراه با توزیع ۳۴/۳۳/۳۳ سطح دشواری تأیید کند.

### افزودن واژه جدید

در فایل `src/data.js` یک شیء جدید به آرایه `WORD_BANK` اضافه کنید. هر شیء باید شامل پاسخ فارسی (`fa`)، پاسخ انگلیسی (`en`)، راهنمای فارسی (`clueFa`)، راهنمای انگلیسی (`clueEn`) و موضوع (`topic`) باشد. پاسخ‌ها باید بدون فاصله نوشته شوند؛ حداقل طول قابل استفاده در جدول سه نویسه است.

مقادیر مجاز موضوع عبارت‌اند از: `technology`, `science`, `nature`, `animals`, `culture`, `objects`.

---

## English

### Overview

CrossMind is a responsive, browser-based crossword game. Each answer is described by a clue or short riddle, and players enter the answer one character at a time into an interlocking grid. Words run horizontally and vertically and share letters at valid crossings.

### Features

- Complete Persian and English interfaces with automatic RTL/LTR layout.
- 100 distinct randomized puzzles per round: 34 small, 33 medium and 33 large.
- Five, seven or nine answers per puzzle, depending on the selected difficulty.
- A real crossword placement engine that connects words through matching letters.
- Right-to-left horizontal answer order for Persian puzzles.
- Bilingual clue bank across technology, science, nature, animals, culture and objects.
- One-character cell input, automatic movement through the active answer and arrow-key navigation.
- Across/down clue tabs and direct clue selection.
- Single-letter hints, answer checking, full reveal and clear-grid controls.
- Timer, completion percentage, score, optional sound and best-time tracking.
- Browser persistence for the active round, entered answers and previously generated puzzle fingerprints.
- Responsive layout for desktop, tablet and mobile devices.
- No database, API or third-party runtime dependency.

### Run locally

**Requirement:** Node.js 18 or newer.

1. Extract the ZIP or clone the repository.
2. Open a terminal in the project directory.
3. Run:

```bash
npm start
```

4. Visit `http://localhost:4173` in your browser.

Use `npm run dev` for the same local development server. There are no external npm dependencies, so `npm install` is not required.

### How to play

1. Select Persian or English from the language switcher.
2. Choose a grid size or topic. The default selection uses a mix of topics and sizes.
3. Select an Across or Down clue.
4. Enter the answer one letter at a time in the highlighted cells.
5. Use **Hint** to reveal one empty letter or **Check answers** to validate the current grid.
6. Select **New puzzle** to move to an unused puzzle in the current round.

### Keyboard shortcuts

| Key | Action |
|---|---|
| Arrow keys | Move between grid cells |
| Backspace | Delete the current letter or move to the previous cell |
| Enter | Check answers |
| H | Reveal one hint letter |

### Puzzle generation and non-repetition

The generator selects entries from the word bank, searches for matching letters, and places each new answer perpendicular to an existing word. Placements that produce conflicting letters or invalid side contacts are rejected. The final grid and clue numbering are created from the accepted word coordinates.

Each round contains 100 puzzles with unique content fingerprints. Generated fingerprints are saved in browser `localStorage` and excluded from later rounds, reducing repeats across visits in the same browser. The current round and typed answers are also persisted locally.

### Project structure

```text
CrossMind/
├── index.html                 # Main page and UI structure
├── package.json               # Run scripts and project metadata
├── server.mjs                 # Lightweight dependency-free Node.js server
├── LICENSE.txt                # Copyright and usage terms
├── README.md                  # Persian and English documentation
├── scripts/
│   └── verify-generator.mjs   # Crossword generator validation
└── src/
    ├── data.js                # Bilingual word bank and UI strings
    ├── crossword.js           # Crossword generation and numbering engine
    ├── main.js                # Game state and UI interactions
    └── styles.css             # Responsive visual design
```

### Run the generator tests

```bash
npm test
```

The test verifies 100 unique puzzles per language, the 34/33/33 difficulty distribution, answer-to-cell consistency and right-to-left horizontal placement in Persian.

### Add more words

Add an object to the `WORD_BANK` array in `src/data.js`. Each entry requires `fa`, `en`, `clueFa`, `clueEn` and `topic` properties. Answers must not contain spaces; the generator uses entries with at least three characters.

Supported topic keys: `technology`, `science`, `nature`, `animals`, `culture` and `objects`.

---

## Author / سازنده

**Hamid Yarali**  
GitHub: [HamidYaraliOfficial](https://github.com/HamidYaraliOfficial)
