import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { KeyboardLayoutHint } from "@/components/shared/KeyboardLayoutHint";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "روال | Reval — مسیر مطالعه‌ات رو هموار کن",
  description:
    "اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. روالت رو بساز، هدف‌گذاری کن، و مسیرت رو هموار کن.",
  keywords: ["روال", "Reval", "مطالعه", "کنکور", "بهره‌وری", "دانش‌آموز"],
  authors: [{ name: "Reval Team" }],
  icons: {
    icon: "/logo.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0C0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--foreground)",
        }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const t = localStorage.getItem('reval:theme:v1'); if (t === 'light') document.documentElement.setAttribute('data-theme', 'light'); } catch {} })()`,
          }}
        />
        {children}
        <KeyboardLayoutHint />
        <Toaster />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
