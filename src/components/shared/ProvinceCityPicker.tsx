'use client';

// ============================================================
// ProvinceCityPicker
// Two-step dropdown picker for Iranian province + city.
// Used in:
//   - Onboarding (signup) — required
//   - Settings → Profile — optional (legacy users fill in later)
// ============================================================

import { useMemo } from 'react';
import { IRAN_PROVINCES, getCitiesForProvince } from '@/lib/iran-locations';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Building2 } from 'lucide-react';

export interface ProvinceCityPickerProps {
  province: string | null;
  city: string | null;
  onProvinceChange: (province: string | null) => void;
  onCityChange: (city: string | null) => void;
  /** Render compact (mobile) or full-width rows */
  compact?: boolean;
  /** Aria-labels for screen readers */
  provinceAriaLabel?: string;
  cityAriaLabel?: string;
}

export function ProvinceCityPicker({
  province,
  city,
  onProvinceChange,
  onCityChange,
  compact = false,
  provinceAriaLabel = 'استان',
  cityAriaLabel = 'شهر',
}: ProvinceCityPickerProps) {
  // When province changes, the city list resets. If the current city isn't in
  // the new province's city list, clear it.
  const cities = useMemo(() => getCitiesForProvince(province), [province]);
  const cityInvalid = province && city && !cities.includes(city);

  // Sort provinces alphabetically (Persian sort). Cities inside each province
  // remain in the order declared (largest first).
  const provinces = useMemo(() => IRAN_PROVINCES.map((p) => p.name).sort((a, b) => a.localeCompare(b, 'fa')), []);

  return (
    <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
      {/* Province picker */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>استان</span>
        </div>
        <Select
          value={province ?? ''}
          onValueChange={(v) => {
            onProvinceChange(v || null);
            // Reset city whenever province changes — the city list is now different.
            onCityChange(null);
          }}
        >
          <SelectTrigger
            aria-label={provinceAriaLabel}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border-strong)] text-[var(--foreground)] rounded-lg h-12 focus:ring-2 focus:ring-mint/50 focus:border-mint/50"
          >
            <SelectValue placeholder="استان را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            <SelectGroup>
              <SelectLabel>استان‌ها</SelectLabel>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* City picker */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
          <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>شهر</span>
        </div>
        <Select
          value={cityInvalid ? '' : city ?? ''}
          onValueChange={(v) => onCityChange(v || null)}
          disabled={!province}
        >
          <SelectTrigger
            aria-label={cityAriaLabel}
            className="w-full bg-[var(--bg-overlay)] border border-[var(--border-strong)] text-[var(--foreground)] rounded-lg h-12 focus:ring-2 focus:ring-mint/50 focus:border-mint/50 disabled:opacity-50"
          >
            <SelectValue placeholder={province ? 'شهر را انتخاب کنید' : 'ابتدا استان را انتخاب کنید'} />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            <SelectGroup>
              <SelectLabel>شهرهای {province ?? ''}</SelectLabel>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
              {cities.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-[var(--foreground-muted)]">شهری یافت نشد</div>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
