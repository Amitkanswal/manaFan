import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "@/core/providers";

// Modern Japanese-inspired sans-serif
const zenKaku = Zen_Kaku_Gothic_New({ 
  subsets: ["latin"],
  weight: ['400', '500', '700', '900'],
  variable: '--font-zen',
  display: 'swap',
});

// Elegant serif for display text
const notoSerif = Noto_Serif_JP({ 
  subsets: ["latin"],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "MangaFan 漫画 - Read Manga Online",
  description: "Your favorite manga reading platform - Discover, read, and track your favorite manga series",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${zenKaku.variable} ${notoSerif.variable} font-sans bg-sumi-950 text-sumi-100`}>
        <Providers>
          {/* Subtle pattern overlay */}
          <div className="fixed inset-0 pattern-seigaiha pointer-events-none opacity-50" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
