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
  "سلام {name}! امروز چطور می‌خوای روالت رو بسازی؟",
  "دوباره سلام {name}! افتادیم روی روال 🔥",
  "خوش اومدی {name}! همه‌چی رواله 🎯",
  "سلام رفیق! {name}، آماده‌ای امروز رو عالی بچرخونی؟",
  "هی {name}! وقتشه روالت رو بندازی تو راه 💪",
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
