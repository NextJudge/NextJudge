import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextJudge - Run competitive programming contests with ease.",
  description:
    "NextJudge is a competitive programming platform built for the modern era. NextJudge is designed to be easy to use, fast, and extensible.",
  openGraph: {
    type: "website",
    url: "https://nextjudge.vercel.app/",
    title: "NextJudge - Run competitive programming contests with ease.",
    description:
      "NextJudge is a competitive programming platform built for the modern era. NextJudge is designed to be easy to use, fast, and extensible.",
    siteName: "NextJudge",
    images: [
      {
        url: "https://nextjudge.vercel.app/og.png",
        secureUrl: "https://nextjudge.vercel.app/og.png",
        width: 2880,
        height: 1612,
        alt: "NextJudge - Run competitive programming contests with ease.",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "production" && (
          <Script
            defer
            src="/stats/script.js"
            data-website-id="f9612612-8d19-48f2-8118-d1561bfe443a"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
