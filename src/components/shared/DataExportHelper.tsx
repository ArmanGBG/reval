'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { toPersianDigits } from '@/lib/persian-date';

// =================================================================
// DataExportHelper
// Invisible component that listens for the `reval-export-data` custom
// event (fired by the Command Palette) and exports the student's task
// data as both CSV and JSON files.
//
// Exported files are saved to the browser's download folder:
//   - reval-tasks-{date}.csv
//   - reval-tasks-{date}.json
// =================================================================

interface ExportRow {
  تاریخ: string;
  درس: string;
  مبحث: string;
  'نوع رشته': string;
  'انواع فعالیت': string;
  'زمان هدف (دقیقه)': string | number;
  'زمان واقعی (دقیقه)': string | number;
  'تعداد تست هدف': string | number;
  'تعداد تست واقعی': string | number;
  وضعیت: string;
  'ایجاد کننده': string;
}

function statusLabel(status: boolean | null): string {
  if (status === true) return 'انجام شد';
  if (status === false) return 'انجام نشد';
  return 'در انتظار';
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function escapeCsv(value: unknown): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function DataExportHelper() {
  const tasks = useAppStore((s) => s.tasks);
  const user = useAppStore((s) => s.user);

  useEffect(() => {
    const handler = () => {
      if (!tasks || tasks.length === 0) {
        toast.warning('داده‌ای برای خروجی وجود ندارد', {
          description: 'ابتدا تسک‌هایی را اضافه کنید',
        });
        return;
      }

      // Build CSV rows
      const rows: ExportRow[] = tasks.map((t) => ({
        تاریخ: t.date,
        درس: t.subject,
        مبحث: t.topic ?? '',
        'نوع رشته': t.fieldType ?? 'کلاس بدون حوزه',
        'انواع فعالیت': (t.activityTypes ?? []).join(' / '),
        'زمان هدف (دقیقه)': t.targetTimeMinutes ?? '',
        'زمان واقعی (دقیقه)': t.actualTimeMinutes ?? '',
        'تعداد تست هدف': t.targetTestCount ?? '',
        'تعداد تست واقعی': t.actualTestCount ?? '',
        وضعیت: statusLabel(t.completed),
        'ایجاد کننده': t.createdBy === 'advisor' ? 'مشاور' : 'دانش‌آموز',
      }));

      const headers = Object.keys(rows[0]) as (keyof ExportRow)[];

      // Prepend BOM so Excel reads UTF-8 Persian correctly
      const csvLines = [
        headers.join(','),
        ...rows.map((r) =>
          headers.map((h) => escapeCsv(r[h])).join(','),
        ),
      ];
      const csv = '\uFEFF' + csvLines.join('\n');

      // Build JSON summary
      const summary = {
        exportedAt: new Date().toISOString(),
        student: user
          ? {
              name: user.name,
              grade: user.grade,
              major: user.major,
            }
          : null,
        stats: {
          totalTasks: tasks.length,
          completed: tasks.filter((t) => t.completed === true).length,
          skipped: tasks.filter((t) => t.completed === false).length,
          pending: tasks.filter((t) => t.completed === null).length,
          totalMinutesPlanned: tasks.reduce(
            (s, t) => s + (t.targetTimeMinutes ?? 0),
            0,
          ),
          totalMinutesActual: tasks.reduce(
            (s, t) => s + (t.actualTimeMinutes ?? 0),
            0,
          ),
          totalTests: tasks.reduce(
            (s, t) => s + (t.actualTestCount ?? 0),
            0,
          ),
        },
        tasks,
      };

      const stamp = todayStamp();
      downloadBlob(csv, `reval-tasks-${stamp}.csv`, 'text/csv;charset=utf-8');
      downloadBlob(
        JSON.stringify(summary, null, 2),
        `reval-tasks-${stamp}.json`,
        'application/json',
      );

      toast.success('خروجی داده‌ها آماده شد', {
        description: `${toPersianDigits(tasks.length)} تسک در دو فایل CSV و JSON`,
      });
    };

    window.addEventListener('reval-export-data', handler);
    return () => window.removeEventListener('reval-export-data', handler);
  }, [tasks, user]);

  return null;
}
