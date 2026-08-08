import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Reval logo — the official logo from the GitHub repo.
 * Uses logo.png which includes both the green wheat/plant
 * icon and the Persian wordmark "روال" as a single composed image.
 * Background has been removed (transparent PNG).
 * The `showWord` prop is accepted for API compatibility but is a no-op
 * since the image already includes the wordmark.
 */
export function Logo({
  className,
  size = 28,
  showWord = true,
}: {
  className?: string;
  /** Controls the height of the logo; width scales proportionally */
  size?: number;
  /** No-op — the image already includes the wordmark */
  showWord?: boolean;
}) {
  // logo.png is 183×82 (w×h). We scale based on the requested height.
  const LOGO_ASPECT = 183 / 82; // ≈ 2.23
  const width = Math.round(size * LOGO_ASPECT);

  return (
    <Image
      src="/logo.png"
      alt="روال"
      width={width}
      height={size}
      className={cn("select-none", className)}
      priority
    />
  );
}

/**
 * Legacy mark-only export for places that only need the icon.
 * Falls back to the full logo since the repo logo is a composed image.
 */
export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return <Logo className={className} size={size} />;
}
