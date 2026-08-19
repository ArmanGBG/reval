'use client';

export function ClassSessionFields({
  teacherClassName,
  sessionNumber,
  onTeacherClassNameChange,
  onSessionNumberChange,
  teacherSuggestions = [],
}: {
  teacherClassName: string;
  sessionNumber: string;
  onTeacherClassNameChange: (value: string) => void;
  onSessionNumberChange: (value: string) => void;
  teacherSuggestions?: string[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[11px] text-[var(--foreground-muted)]">نام استاد یا کلاس</label>
        {teacherSuggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {teacherSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onTeacherClassNameChange(suggestion)}
                className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${teacherClassName === suggestion ? 'border-[#35C49A]/40 bg-[#35C49A]/15 text-[#72E0BF]' : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--foreground-muted)] hover:border-[var(--border-strong)]'}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={teacherClassName}
          onChange={(event) => onTeacherClassNameChange(event.target.value)}
          placeholder="مثلاً استاد محمدی"
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[#35C49A]/50"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] text-[var(--foreground-muted)]">شماره یا عنوان جلسه</label>
        <input
          type="text"
          value={sessionNumber}
          onChange={(event) => onSessionNumberChange(event.target.value)}
          placeholder="مثلاً جلسه ۱۲"
          className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[#35C49A]/50"
        />
      </div>
    </div>
  );
}
