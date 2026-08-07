import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "روال | Reval — مسیر مطالعه‌ات رو هموار کن",
  description:
    "اپلیکیشن مدیریت مطالعه و بهره‌وری دانش‌آموزی. روالت رو بساز، هدف‌گذاری کن، و مسیرت رو هموار کن.",
  keywords: ["روال", "Reval", "مطالعه", "کنکور", "بهره‌وری", "دانش‌آموز"],
  authors: [{ name: "Reval Team" }],
  icons: {
    icon: "/logo.svg",
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
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased`}
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--foreground)",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
