import { NextRequest, NextResponse } from 'next/server';
import { ParsedTask, FieldType, ActivityType } from '@/lib/types';
import { SUBJECTS, TOPICS } from '@/lib/constants/mockData';

// ===== Local Persian Text Parser =====
// Used as fallback when Gemini API key is not available

const ACTIVITY_MAP: Record<string, ActivityType> = {
  'مطالعه': 'مطالعه',
  'مرور': 'مرور',
  'تست آموزشی': 'تست آموزشی',
  'تست سنجشی': 'تست سنجشی',
  'تست': 'تست آموزشی',
  'حل تمرین': 'تست آموزشی',
  'آموزش': 'مطالعه',
};

const SUBJECT_NAMES = SUBJECTS.map((s) => s.name);

function parsePersianNumber(text: string): number | null {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let result = '';
  for (const ch of text) {
    const idx = persianDigits.indexOf(ch);
    if (idx >= 0) {
      result += idx;
    } else if (/\d/.test(ch)) {
      result += ch;
    } else if (result.length > 0) {
      break;
    }
  }
  return result ? parseInt(result) : null;
}

function findSubject(text: string): string | null {
  for (const name of SUBJECT_NAMES) {
    if (text.includes(name)) return name;
  }
  return null;
}

function findTopic(text: string, subject: string): string {
  const subjectTopics = TOPICS[subject] || [];
  for (const topic of subjectTopics) {
    if (text.includes(topic)) return topic;
  }
  return subjectTopics[0] || 'عمومی';
}

function findActivities(text: string): ActivityType[] {
  const found: ActivityType[] = [];
  for (const [key, value] of Object.entries(ACTIVITY_MAP)) {
    if (text.includes(key) && !found.includes(value)) {
      found.push(value);
    }
  }
  return found.length > 0 ? found : ['مطالعه'];
}

function findTimeMinutes(text: string): number {
  const hourMatch = text.match(/(\d+([.,]\d+)?)\s*ساعت/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1].replace(',', '.')) * 60);
  }
  const persianHourMatch = text.match(/([۰-۹]+([.,][۰-۹]+)?)\s*ساعت/);
  if (persianHourMatch) {
    const num = parsePersianNumber(persianHourMatch[1]);
    if (num !== null) return num * 60;
  }
  const minuteMatch = text.match(/(\d+)\s*دقیقه/);
  if (minuteMatch) {
    return parseInt(minuteMatch[1]);
  }
  const persianMinuteMatch = text.match(/([۰-۹]+)\s*دقیقه/);
  if (persianMinuteMatch) {
    const num = parsePersianNumber(persianMinuteMatch[1]);
    if (num !== null) return num;
  }
  return 60;
}

function findTestCount(text: string): number {
  const testMatch = text.match(/(\d+)\s*تست/);
  if (testMatch) return parseInt(testMatch[1]);
  const persianTestMatch = text.match(/([۰-۹]+)\s*تست/);
  if (persianTestMatch) {
    const num = parsePersianNumber(persianTestMatch[1]);
    if (num !== null) return num;
  }
  return 0;
}

function findFieldType(text: string): FieldType {
  if (text.includes('نهایی')) return 'نهایی';
  return 'کنکور';
}

function parseSingleEntry(text: string): ParsedTask | null {
  const subject = findSubject(text);
  if (!subject) return null;

  return {
    subject,
    topic: findTopic(text, subject),
    target_time_minutes: findTimeMinutes(text),
    target_test_count: findTestCount(text),
    field_type: findFieldType(text),
    activity_types: findActivities(text),
  };
}

function localParse(text: string): ParsedTask[] {
  // Split by common delimiters: comma, "،", newline, semicolon
  const entries = text
    .split(/[،,\n؛;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const tasks: ParsedTask[] = [];
  for (const entry of entries) {
    const parsed = parseSingleEntry(entry);
    if (parsed) tasks.push(parsed);
  }

  // If no entries parsed with delimiters, try the whole text
  if (tasks.length === 0) {
    const parsed = parseSingleEntry(text);
    if (parsed) tasks.push(parsed);
  }

  return tasks;
}

// ===== Gemini API Parser =====
// Used when GEMINI_API_KEY is available in environment

const GEMINI_SYSTEM_PROMPT = `You are a Persian study plan parser for an Iranian student app called Reval (روال).
The user will provide a natural language description of their study plan in Persian/Farsi.
You must parse it and return a STRICT JSON array matching this TypeScript interface:

interface ParsedTask {
  subject: string;
  topic?: string;
  target_time_minutes: number;
  target_test_count: number;
  field_type: "کنکور" | "نهایی";
  activity_types: ("مطالعه" | "مرور" | "تست آموزشی" | "تست سنجشی")[];
}

Valid subjects: ریاضی, فیزیک, شیمی, زیست, ادبیات, عربی, دینی, زبان, تاریخ, جغرافیا, فلسفه, اقتصاد
Valid activity types: مطالعه, مرور, تست آموزشی, تست سنجشی
Default field_type to "کنکور" unless "نهایی" is explicitly mentioned.
Default activity_types to ["مطالعه"] if not specified.
Return ONLY the JSON array, no markdown, no explanation.`;

async function geminiParse(text: string): Promise<ParsedTask[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: GEMINI_SYSTEM_PROMPT },
                { text: `\n\nUser input: ${text}` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return [];

    // Parse the JSON response
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      // Validate each task
      return parsed.filter(
        (t: unknown): t is ParsedTask =>
          typeof t === 'object' &&
          t !== null &&
          'subject' in t &&
          'target_time_minutes' in t &&
          'target_test_count' in t &&
          'field_type' in t &&
          'activity_types' in t
      );
    }

    return [];
  } catch {
    return [];
  }
}

// ===== Main Handler =====
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'متن وارد نشده است' }, { status: 400 });
    }

    // Try Gemini API first (if key available)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      const geminiTasks = await geminiParse(text);
      if (geminiTasks.length > 0) {
        return NextResponse.json({ tasks: geminiTasks, source: 'gemini' });
      }
    }

    // Fallback to local parser
    const tasks = localParse(text);
    return NextResponse.json({ tasks, source: 'local' });
  } catch {
    return NextResponse.json({ error: 'خطا در پردازش متن' }, { status: 500 });
  }
}
