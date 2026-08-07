import { NextRequest, NextResponse } from 'next/server';
import { ParsedTask, FieldType, ActivityType } from '@/lib/types';
import { db } from '@/lib/db';

// ===== Local Persian Text Parser =====
// Used as fallback when Gemini API key is not available
// NOW READS SUBJECT/TOPIC NAMES FROM DATABASE instead of hardcoded mockData

const ACTIVITY_MAP: Record<string, ActivityType> = {
  'مطالعه': 'مطالعه',
  'مرور': 'مرور',
  'تست آموزشی': 'تست آموزشی',
  'تست سنجشی': 'تست سنجشی',
  'تست': 'تست آموزشی',
  'حل تمرین': 'تست آموزشی',
  'آموزش': 'مطالعه',
};

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

/** Find the best subject match from DB names. Supports both full name and abbreviation. */
function findSubject(text: string, subjectNames: string[]): string | null {
  // Try exact match first (longest names first to avoid partial matches)
  const sortedNames = [...subjectNames].sort((a, b) => b.length - a.length);
  for (const name of sortedNames) {
    if (text.includes(name)) return name;
  }

  // Try common abbreviations
  const abbreviations: Record<string, string> = {
    'زیست': 'زیست‌شناسی',
    'ریاضی': 'ریاضی',
    'فیزیک': 'فیزیک',
    'شیمی': 'شیمی',
  };
  for (const [abbr, fullName] of Object.entries(abbreviations)) {
    if (text.includes(abbr) && subjectNames.includes(fullName)) {
      return fullName;
    }
  }

  return null;
}

/** Find a topic/chapter name that appears in the text. */
function findTopic(text: string, topicNames: string[]): string | null {
  // Sort by length desc so longer (more specific) matches win
  const sorted = [...topicNames].sort((a, b) => b.length - a.length);
  for (const topic of sorted) {
    if (text.includes(topic)) return topic;
  }
  return null;
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

// ===== Curriculum Data Cache =====
// Cache DB curriculum data for the lifetime of the server process (refresh on restart)
let curriculumCache: {
  subjectNames: string[];
  topicsBySubject: Record<string, string[]>;
  lastLoaded: number;
} | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCurriculumData() {
  // Return cached data if still fresh
  if (curriculumCache && Date.now() - curriculumCache.lastLoaded < CACHE_TTL_MS) {
    return curriculumCache;
  }

  // Fetch from DB: all active subjects with their chapter and topic titles
  const subjects = await db.subject.findMany({
    where: { isActive: true },
    select: {
      name: true,
      grades: {
        where: { isActive: true },
        select: {
          chapters: {
            where: { isActive: true },
            select: {
              title: true,
              topics: {
                where: { isActive: true },
                select: { title: true },
              },
            },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const subjectNames = subjects.map((s) => s.name);
  const topicsBySubject: Record<string, string[]> = {};

  for (const s of subjects) {
    const allNames: string[] = [];
    for (const gs of s.grades) {
      for (const ch of gs.chapters) {
        // Include chapter title as a matchable "topic"
        allNames.push(ch.title);
        for (const tp of ch.topics) {
          allNames.push(tp.title);
        }
      }
    }
    // Deduplicate
    topicsBySubject[s.name] = [...new Set(allNames)];
  }

  curriculumCache = { subjectNames, topicsBySubject, lastLoaded: Date.now() };
  return curriculumCache;
}

function parseSingleEntry(
  text: string,
  subjectNames: string[],
  topicsBySubject: Record<string, string[]>,
): ParsedTask | null {
  const subject = findSubject(text, subjectNames);
  if (!subject) return null;

  return {
    subject,
    topic: findTopic(text, topicsBySubject[subject] || []),
    target_time_minutes: findTimeMinutes(text),
    target_test_count: findTestCount(text),
    field_type: findFieldType(text),
    activity_types: findActivities(text),
  };
}

async function localParse(text: string): Promise<ParsedTask[]> {
  const { subjectNames, topicsBySubject } = await getCurriculumData();

  // Split by common delimiters: comma, "،", newline, semicolon
  const entries = text
    .split(/[،,\n؛;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const tasks: ParsedTask[] = [];
  for (const entry of entries) {
    const parsed = parseSingleEntry(entry, subjectNames, topicsBySubject);
    if (parsed) tasks.push(parsed);
  }

  // If no entries parsed with delimiters, try the whole text
  if (tasks.length === 0) {
    const parsed = parseSingleEntry(text, subjectNames, topicsBySubject);
    if (parsed) tasks.push(parsed);
  }

  return tasks;
}

// ===== Gemini API Parser =====
// Used when GEMINI_API_KEY is available in environment
// NOW DYNAMICALLY BUILDS the valid subjects list from the database

async function buildGeminiPrompt(): Promise<string> {
  const { subjectNames, topicsBySubject } = await getCurriculumData();

  // Build a subjects + topics reference for the AI
  let subjectsRef = '';
  for (const name of subjectNames) {
    const topics = topicsBySubject[name] || [];
    // Only include first 10 topics per subject to keep prompt size manageable
    const sampleTopics = topics.slice(0, 10);
    subjectsRef += `\n- ${name}: ${sampleTopics.join('، ')}${topics.length > 10 ? '، ...' : ''}`;
  }

  return `You are a Persian study plan parser for an Iranian student app called Reval (روال).
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

Valid subjects and their known topics/chapters:
${subjectsRef}

Valid activity types: مطالعه, مرور, تست آموزشی, تست سنجشی
Default field_type to "کنکور" unless "نهایی" is explicitly mentioned.
Default activity_types to ["مطالعه"] if not specified.
The subject field MUST exactly match one of the valid subject names above.
Return ONLY the JSON array, no markdown, no explanation.`;
}

async function geminiParse(text: string): Promise<ParsedTask[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const systemPrompt = await buildGeminiPrompt();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
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
    const tasks = await localParse(text);
    return NextResponse.json({ tasks, source: 'local' });
  } catch {
    return NextResponse.json({ error: 'خطا در پردازش متن' }, { status: 500 });
  }
}
