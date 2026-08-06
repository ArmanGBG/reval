'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Sparkles,
  ClipboardCheck,
  ListTodo,
  Flame,
  Trophy,
  Target,
  Brain,
  Mail,
  CheckCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Notification } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-date';

// ===== Icon mapping =====
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardCheck,
  ListTodo,
  Flame,
  Trophy,
  Target,
  Brain,
  Mail,
};

// ===== Relative time label (Persian) =====
function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'همین الان';
  if (diffMinutes < 60) return `${toPersianDigits(diffMinutes)} دقیقه پیش`;
  if (diffHours < 24) return `${toPersianDigits(diffHours)} ساعت پیش`;
  return `${toPersianDigits(diffDays)} روز پیش`;
}

// ===== Color stripe + dot resolver =====
function resolveColor(color: string): string {
  // CSS variable strings like 'var(--danger)' → use as-is in style
  return color;
}

// ===== Notification Item =====
function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const Icon = ICON_MAP[notification.icon] || Bell;
  const colorValue = resolveColor(notification.color);

  return (
    <button
      onClick={() => {
        if (!notification.read) onMarkRead(notification.id);
      }}
      className={`group w-full flex items-start gap-3 rounded-xl p-3 text-right transition-colors duration-150 ${
        notification.read
          ? 'opacity-60 hover:opacity-80'
          : 'hover:bg-[rgba(255,255,255,0.03)]'
      }`}
    >
      {/* Left color stripe (right side in RTL, so we use border-r) */}
      <div
        className="flex-shrink-0 w-0.5 self-stretch rounded-full"
        style={{ backgroundColor: colorValue }}
      />
      {/* Icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
        style={{ backgroundColor: `${colorValue}18` }}
      >
        <span style={{ color: colorValue }}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
            {notification.title}
          </p>
          {!notification.read && (
            <span
              className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
              style={{ backgroundColor: colorValue }}
            />
          )}
        </div>
        {notification.senderName && (
          <p className="text-[10px] font-medium mt-0.5" style={{ color: colorValue }}>
            از {notification.senderName}
          </p>
        )}
        <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-snug">
          {notification.description}
        </p>
        <p className="text-[10px] text-[var(--foreground-subtle)] mt-1.5">
          {getRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ===== Main NotificationCenter Component =====
export default function NotificationCenter() {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    refreshNotifications,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Refresh notifications on mount and periodically
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000); // every 60s
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="icon-btn relative w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        aria-label={unreadNotificationCount > 0 ? `${toPersianDigits(unreadNotificationCount)} اعلان خوانده‌نشده` : 'اعلان‌ها'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {/* Badge */}
        {unreadNotificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-1 -left-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
            style={{
              backgroundColor:
                notifications.some((n) => n.color === 'var(--danger)' && !n.read)
                  ? 'var(--danger)'
                  : 'var(--warning)',
            }}
          >
            {toPersianDigits(Math.min(unreadNotificationCount, 9))}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2 left-0 z-50 w-80 rounded-xl border border-[var(--border-strong)] shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-overlay)',
            }}
            role="region"
            aria-label="اعلان‌ها"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                اعلان‌ها
              </h3>
              {unreadNotificationCount > 0 && (
                <span className="text-[10px] font-medium text-[var(--foreground-muted)] bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-md">
                  {toPersianDigits(unreadNotificationCount)} جدید
                </span>
              )}
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  اعلانی جدید نیست 🎉
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  همه‌چیز روبراهه!
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto custom-scrollbar py-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markNotificationRead}
                  />
                ))}
              </div>
            )}

            {/* Mark all as read */}
            {notifications.length > 0 && unreadNotificationCount > 0 && (
              <div className="border-t border-[var(--border)] px-3 py-2">
                <button
                  onClick={() => {
                    markAllNotificationsRead();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg h-9 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  خواندن همه
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
