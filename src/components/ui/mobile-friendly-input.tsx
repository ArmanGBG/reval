"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface MobileFriendlyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange" | "readOnly"
  > {
  value: string
  onValueChange: (value: string) => void
  onCommit?: (value: string) => void
  overlayTitle?: string
  doneLabel?: string
  textareaClassName?: string
}

const MOBILE_BREAKPOINT = 1024

const baseInputClassName =
  "flex h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"

/**
 * Uses a regular input on desktop and a viewport-safe editor below 1024px.
 * Mobile changes are committed only when the user presses Done or Enter.
 */
export const MobileFriendlyInput = React.forwardRef<
  HTMLInputElement,
  MobileFriendlyInputProps
>(function MobileFriendlyInput(
  {
    value,
    onValueChange,
    onCommit,
    overlayTitle,
    doneLabel = "انجام شد",
    textareaClassName,
    className,
    placeholder,
    disabled,
    onClick,
    onFocus,
    dir,
    ...inputProps
  },
  forwardedRef,
) {
  // Desktop is the hydration-safe initial render. Device detection runs only
  // after mount, so server and first-client markup remain identical.
  const [isMobile, setIsMobile] = React.useState(false)
  const [showOverlay, setShowOverlay] = React.useState(false)
  const [draftValue, setDraftValue] = React.useState(value)
  const [mounted, setMounted] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    setMounted(true)
    const syncDevice = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    syncDevice()
    window.addEventListener("resize", syncDevice, { passive: true })
    return () => window.removeEventListener("resize", syncDevice)
  }, [])

  React.useEffect(() => {
    if (!showOverlay) setDraftValue(value)
  }, [showOverlay, value])

  React.useEffect(() => {
    if (!showOverlay) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true })
      const length = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(length, length)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
    }
  }, [showOverlay])

  React.useEffect(() => {
    if (!isMobile && showOverlay) setShowOverlay(false)
  }, [isMobile, showOverlay])

  const openOverlay = (event: React.MouseEvent<HTMLInputElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled || !isMobile) return
    setDraftValue(value)
    setShowOverlay(true)
  }

  const commit = () => {
    onValueChange(draftValue)
    onCommit?.(draftValue)
    setShowOverlay(false)
  }

  const overlay = (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          key="mobile-friendly-input-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={overlayTitle || placeholder || "ویرایش متن"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          // h-dvh follows the visual viewport as the iOS keyboard opens,
          // unlike 100vh which can retain the pre-keyboard viewport height.
          className="fixed inset-0 z-[9999] flex h-dvh flex-col bg-white/80 text-zinc-950 backdrop-blur-lg dark:bg-black/80 dark:text-zinc-50"
          dir={dir}
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-white/10">
            <p className="min-w-0 truncate text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {overlayTitle || placeholder || "متن را وارد کنید"}
            </p>
            <button
              type="button"
              onClick={commit}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              aria-label={doneLabel}
            >
              <Check className="size-4" aria-hidden="true" />
              <span>{doneLabel}</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
            <textarea
              ref={textareaRef}
              autoFocus
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault()
                  commit()
                }
                if (event.key === "Escape") {
                  event.preventDefault()
                  setShowOverlay(false)
                }
              }}
              enterKeyHint="done"
              placeholder={placeholder}
              className={cn(
                "h-full w-full resize-none bg-transparent text-2xl leading-relaxed text-inherit outline-none placeholder:text-zinc-400 sm:text-3xl dark:placeholder:text-zinc-600",
                textareaClassName,
              )}
              aria-label={overlayTitle || placeholder || "متن"}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <input
        {...inputProps}
        ref={forwardedRef}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={isMobile}
        inputMode={isMobile ? "none" : inputProps.inputMode}
        onClick={openOverlay}
        onFocus={(event) => {
          onFocus?.(event)
          if (isMobile && !disabled && !showOverlay) {
            setDraftValue(value)
            setShowOverlay(true)
          }
        }}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(baseInputClassName, isMobile && "cursor-text", className)}
        dir={dir}
        aria-haspopup={isMobile ? "dialog" : undefined}
      />
      {mounted && isMobile ? createPortal(overlay, document.body) : null}
    </>
  )
})

MobileFriendlyInput.displayName = "MobileFriendlyInput"
