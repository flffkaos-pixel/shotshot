import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/lib/analytics";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const font = Inter({ subsets: ["latin"] });

// ponytail: Geist for the marketing page display type (dev-tool feel), Inter stays for the editor.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Shotshot - Free App Store Screenshot Maker",
  description:
    "Design and export App Store + Google Play screenshots for free. Drag-to-edit, AI captions (BYOK), OCR caption-verify, every size baked in.",
  openGraph: {
    title: "Shotshot - Free App Store Screenshot Maker",
    description: "AI captions + OCR verify + free forever for indie devs.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className={font.className}
        style={{ fontFamily: '"Inter", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
      >
        <ErrorBoundary>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </ErrorBoundary>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
