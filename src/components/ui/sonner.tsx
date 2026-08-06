'use client';

import * as React from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Variant visual config for toast icons.
 * Each variant gets a colored circular badge with an outlined icon.
 */
const VARIANT_ICON_CONFIG = {
  success: {
    color: 'var(--accent)',
    bg: 'var(--accent-soft)',
    border: 'rgba(62, 180, 137, 0.35)',
    Icon: Check,
  },
  error: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    Icon: X,
  },
  warning: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    Icon: AlertTriangle,
  },
  info: {
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.35)',
    Icon: Info,
  },
} as const;

type ToastVariant = keyof typeof VARIANT_ICON_CONFIG;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const cfg = VARIANT_ICON_CONFIG[variant];
  const Icon = cfg.Icon;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '9999px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        flexShrink: 0,
        marginLeft: 2,
      }}
    >
      <Icon size={13} strokeWidth={3} />
    </span>
  );
}

/**
 * Reval Toaster — Modern Dark Cinema styling for sonner.
 *
 * - Responsive position: bottom-center on mobile, bottom-left on desktop.
 * - Variant-specific backgrounds, borders, glow shadows (success/error/etc).
 * - Custom circular badge icons with lucide glyphs.
 * - Wider on desktop (max-w-md / 28rem) with comfortable padding.
 *
 * The per-variant colors are wired through sonner's CSS variables
 * (--success-bg, --success-border, …) so they cascade to every toast
 * of that type. Glow shadows are added via [data-sonner-toast] selectors
 * in globals.css.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const isMobile = useIsMobile();
  const position: ToasterProps['position'] = isMobile
    ? 'bottom-center'
    : 'bottom-left';
  const offset = isMobile ? '16px' : '24px';

  return (
    <Sonner
      position={position}
      dir="rtl"
      theme="dark"
      richColors={false}
      closeButton
      duration={3500}
      gap={8}
      offset={offset}
      className="reval-toaster"
      style={
        {
          // Base / normal toast
          '--normal-bg': 'var(--bg-overlay)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border-strong)',
          // Success — accent (mint) glow
          '--success-bg': 'rgba(62, 180, 137, 0.10)',
          '--success-text': 'var(--foreground)',
          '--success-border': 'rgba(62, 180, 137, 0.45)',
          // Error — red glow
          '--error-bg': 'rgba(239, 68, 68, 0.10)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'rgba(239, 68, 68, 0.45)',
          // Warning — amber glow
          '--warning-bg': 'rgba(245, 158, 11, 0.10)',
          '--warning-text': 'var(--foreground)',
          '--warning-border': 'rgba(245, 158, 11, 0.45)',
          // Info — cyan glow
          '--info-bg': 'rgba(6, 182, 212, 0.10)',
          '--info-text': 'var(--foreground)',
          '--info-border': 'rgba(6, 182, 212, 0.45)',
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          direction: 'rtl',
          fontFamily: 'var(--font-vazirmatn)',
          borderRadius: '14px',
          fontSize: '14px',
          fontWeight: 500,
          padding: '12px 16px',
          maxWidth: '28rem',
          width: 'auto',
          boxShadow:
            '0 16px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        },
        classNames: {
          toast: 'reval-toast',
          success: 'reval-toast-success',
          error: 'reval-toast-error',
          warning: 'reval-toast-warning',
          info: 'reval-toast-info',
          title: 'reval-toast-title',
          description: 'reval-toast-desc',
          closeButton: 'reval-toast-close',
        },
      }}
      icons={{
        success: <ToastIcon variant="success" />,
        error: <ToastIcon variant="error" />,
        warning: <ToastIcon variant="warning" />,
        info: <ToastIcon variant="info" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
