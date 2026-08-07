'use client';

import * as React from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Variant visual config for toast icons — monochrome with a tiny
 * status-colored dot. No neon, no colored glow.
 */
const VARIANT_ICON_CONFIG = {
  success: {
    color: 'var(--success)',
    bg: 'rgba(62, 186, 140, 0.10)',
    Icon: Check,
  },
  error: {
    color: 'var(--danger)',
    bg: 'rgba(229, 72, 77, 0.10)',
    Icon: X,
  },
  warning: {
    color: 'var(--warning)',
    bg: 'rgba(216, 150, 20, 0.10)',
    Icon: AlertTriangle,
  },
  info: {
    color: 'var(--accent)',
    bg: 'var(--accent-soft)',
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
        width: 20,
        height: 20,
        borderRadius: '9999px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        flexShrink: 0,
        marginLeft: 2,
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
    </span>
  );
}

/**
 * Reval Toaster — Linear-style calm, monochrome styling for sonner.
 *
 * - Responsive position: bottom-center on mobile, bottom-left on desktop.
 * - Single neutral background + subtle border for all variants.
 * - Tiny monochrome status icon badge per variant.
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
          // Base / normal toast — neutral elevated surface
          '--normal-bg': 'var(--bg-overlay)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          // Success — neutral with subtle status tint
          '--success-bg': 'var(--bg-overlay)',
          '--success-text': 'var(--foreground)',
          '--success-border': 'var(--border)',
          // Error — neutral with subtle status tint
          '--error-bg': 'var(--bg-overlay)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'var(--border)',
          // Warning — neutral
          '--warning-bg': 'var(--bg-overlay)',
          '--warning-text': 'var(--foreground)',
          '--warning-border': 'var(--border)',
          // Info — neutral
          '--info-bg': 'var(--bg-overlay)',
          '--info-text': 'var(--foreground)',
          '--info-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          direction: 'rtl',
          fontFamily: 'var(--font-vazirmatn)',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 500,
          padding: '12px 14px',
          maxWidth: '28rem',
          width: 'auto',
          boxShadow:
            '0 12px 32px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
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
