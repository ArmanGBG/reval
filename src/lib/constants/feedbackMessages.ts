// ===== Reval (روال) - Feedback Messages =====

export const SUCCESS_MESSAGES = [
  "برکانا",
  "مرحبا!!",
  "بابا خفن!",
  "آتیش به پا کردی",
  "یاشاسین!",
  "ساغوووول!",
  "سرچاو!",
  "دمت گرمه!",
  "بژی!",
  "کاربلد صلح طلب!",
  "روالت به‌راهه 🔥",
];

export const FAILURE_MESSAGES = [
  "پیش میاد...",
  "ایشالا سری بعدی...",
  "بزرگ میشی یادت میره!",
  "فدا یه تار موت! فردا جبران کن",
  "فدای سرت! فردا می‌افتیم رو روال 💪",
];

export function getRandomSuccessMessage(): string {
  return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
}

export function getRandomFailureMessage(): string {
  return FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)];
}

// ===== Greeting Messages =====
export const GREETINGS = [
  "سلام {name}. نیازی نیست همه‌چیز بی‌نقص باشه، فقط کافیه شروع کنیم 🌱",
  "خوش اومدی {name}. یه نفس عمیق بکش تا کارارو بندازیم روی روال 🍃",
  "سلام {name}! بیا قدم اول امروز رو برداریم 👣",
  "سلام {name}. مسیرت روشنه و همه‌چیز مرتبه؛ بریم سراغ برنامه امروز؟ 🎧",
  "سلام {name}! خسته نباشی، بریم ببینیم امروز چیا داریم 📋",
  "سلام {name}. خوشحالیم که دوباره اینجایی، بریم سراغ ادامه‌ی مسیر ✌️",
  "خوش برگشتی {name}. امروز رو بی‌خیالِ استرس، فقط روی روال پیش بریم ☁️",
  "سلام {name}! چای یا قهوه‌ات رو بیار که می‌خوایم استارت بزنیم ☕️",
];

export function getGreeting(name: string): string {
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  return greeting.replace('{name}', name);
}

// ===== Persian Date =====
export function getPersianDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    calendar: 'persian',
    numberingSystem: 'latn',
  };
  return `امروز ${now.toLocaleDateString('fa-IR', options)}`;
}
