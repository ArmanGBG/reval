import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Reval logo — the official logo from the GitHub repo.
 * Uses logo.webp which includes both the green wheat/plant
 * icon and the Persian wordmark "روال" as a single composed image.
 * Background has been removed and transparency is preserved.
 *
 * The wordmark is white, so a light-theme variant (logo-light.webp,
 * wordmark recolored to dark foreground) exists for surfaces that
 * become white in light mode. The default variant="auto" renders both
 * images and toggles them purely via CSS based on the
 * html[data-theme] attribute — no JS state, no flash on first paint
 * (the inline theme script in layout.tsx sets the attribute before
 * hydration). Use variant="dark" for logos placed on colored
 * (accent/mint) surfaces that stay dark in both themes.
 *
 * The `showWord` prop is accepted for API compatibility but is a no-op
 * since the image already includes the wordmark.
 */
export function Logo({
  className,
  size = 28,
  showWord = true,
  variant = "auto",
}: {
  className?: string;
  /** Controls the height of the logo; width scales proportionally */
  size?: number;
  /** No-op — the image already includes the wordmark */
  showWord?: boolean;
  /** auto = follow theme, dark = always white wordmark (for colored surfaces) */
  variant?: "auto" | "dark";
}) {
  // logo.webp is 183x82 (w x h). We scale based on the requested height.
  const LOGO_ASPECT = 183 / 82; // ≈ 2.23
  const width = Math.round(size * LOGO_ASPECT);

  if (variant === "dark") {
    return (
      <Image
        src="/logo.webp"
        alt="روال"
        width={width}
        height={size}
        className={cn("select-none", className)}
        priority
      />
    );
  }

  return (
    <span className={cn("relative inline-block select-none", className)} style={{ height: size, width }}>
      <Image
        src="/logo.webp"
        alt="روال"
        width={width}
        height={size}
        className="theme-logo-dark absolute inset-0 h-full w-full"
        priority
      />
      <Image
        src="/logo-light.webp"
        alt="روال"
        width={width}
        height={size}
        className="theme-logo-light absolute inset-0 h-full w-full"
        priority
      />
    </span>
  );
}

/**
 * Legacy mark-only export for places that only need the icon.
 * Falls back to the full logo since the repo logo is a composed image.
 */
export function LogoMark({
  className,
  size = 28,
  variant = "auto",
}: {
  className?: string;
  size?: number;
  variant?: "auto" | "dark";
}) {
  return <Logo className={className} size={size} variant={variant} />;
}
