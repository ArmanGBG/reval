'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import {
  Settings,
  Building2,
  Upload,
  Image as ImageIcon,
  Save,
  Check,
  X,
  Trash2,
  Eye,
  Type,
} from 'lucide-react';

export default function InstituteSettings() {
  const { instituteProfile, setInstituteProfile } = useAppStore();
  const [name, setName] = useState(instituteProfile.name);
  const [logoPreview, setLogoPreview] = useState<string | null>(instituteProfile.logoUrl);
  const [saved, setSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setInstituteProfile({
      name: name.trim(),
      logoUrl: logoPreview,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in-up">
      {/* ============ Page Header ============ */}
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-mint/15 border border-mint/20 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-mint" />
        </div>
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">تنظیمات آموزشگاه</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">مدیریت برندینگ و مشخصات آموزشگاه</p>
        </div>
      </header>

      {/* ============ 2-col Form Layout ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* ----- Form Column ----- */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          {/* Institute Name Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-hover surface-1 edge-highlight rounded-[16px] p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
                <Type className="w-4 h-4 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">نام آموزشگاه</h3>
                <p className="text-[11px] text-muted-foreground">در هدر پنل و گزارش‌ها نمایش داده می‌شود</p>
              </div>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام آموزشگاه را وارد کنید"
              className="w-full bg-[var(--bg-overlay)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-mint/50 transition-colors"
            />
          </motion.section>

          {/* Logo Upload Card */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-hover surface-1 edge-highlight rounded-[16px] p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">لوگوی آموزشگاه</h3>
                <p className="text-[11px] text-muted-foreground">جایگزین لوگوی پیش‌فرض روال</p>
              </div>
            </div>

            {/* Current Logo Preview */}
            {logoPreview && (
              <div className="flex items-center gap-4 mb-4 p-3 bg-[var(--bg-overlay)] rounded-[12px] border border-[var(--border)]">
                <div className="w-16 h-16 rounded-[12px] bg-[var(--bg-base)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={logoPreview}
                    alt="لوگوی آموزشگاه"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">لوگوی فعلی</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">در هدر پنل نمایش داده می‌شود</p>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="icon-btn p-2 rounded-[8px] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-transparent shrink-0"
                  title="حذف لوگو"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-mint bg-mint/10'
                  : 'border-[var(--border-strong)] hover:border-mint/40 hover:bg-[var(--bg-overlay)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center transition-colors ${isDragging ? 'bg-mint/20' : 'bg-[var(--bg-overlay)]'}`}>
                  <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-mint' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm text-foreground">
                  {isDragging ? 'فایل را رها کنید' : 'لوگو را اینجا بکشید یا کلیک کنید'}
                </p>
                <p className="text-[11px] text-muted-foreground/70">PNG, JPG, SVG — حداکثر ۲ مگابایت</p>
              </div>
            </div>
          </motion.section>
        </div>

        {/* ----- Preview Side Column ----- */}
        <div className="lg:col-span-5">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:sticky lg:top-4 surface-1 rounded-[16px] p-5 md:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-mint/15 flex items-center justify-center">
                <Eye className="w-4 h-4 text-mint" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">پیش‌نمایش هدر</h3>
                <p className="text-[11px] text-muted-foreground">نمایش در پنل مدیریت</p>
              </div>
            </div>

            <div className="bg-[var(--bg-base)] border border-[var(--border)] rounded-[12px] p-4">
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="w-12 h-12 rounded-[10px] overflow-hidden flex items-center justify-center bg-[var(--bg-overlay)] border border-[var(--border)]">
                    <img src={logoPreview} alt="لوگو" className="w-full h-full object-contain p-1" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-[10px] bg-mint/15 border border-mint/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-mint">ر</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-foreground">{name || 'آموزشگاه هدف'}</p>
                  <p className="text-[11px] text-muted-foreground">پنل مدیریت آموزشگاه</p>
                </div>
              </div>
            </div>

            {/* Quick facts */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">نام نمایشی</span>
                <span className="text-foreground font-medium truncate max-w-[180px]">{name || '—'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">لوگو</span>
                <span className={logoPreview ? 'text-mint' : 'text-muted-foreground'}>
                  {logoPreview ? 'بارگذاری شده' : 'پیش‌فرض'}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="btn-hover glow-hover w-full mt-6 flex items-center justify-center gap-2 bg-mint text-[var(--bg-deep)] py-3 rounded-[10px] text-sm font-bold"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.div
                    key="saved"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>ذخیره شد!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره تنظیمات</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
