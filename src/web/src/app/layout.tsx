import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextJudge - Host Competitive Programming Contests with Ease",
  generator: "Next.js",
  applicationName: "NextJudge",
  alternates: {
    canonical: "https://nextjudge.net",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": 120,
  },
  description:
    "NextJudge is a competitive programming platform built for the modern era. It is designed to be easy to use, fast, and extensible for everyone.",
  openGraph: {
    title: "NextJudge - Host Competitive Programming Contests with Ease",
    description:
      "NextJudge is a competitive programming platform built for the modern era. It is designed to be easy to use, fast, and extensible for everyone.",
    images: [
      {
        url: "https://nextjudge.net/opengraph-image.webp",
        width: 1496,
        height: 883,
        alt: "NextJudge OpenGraph Image",
      },
    ],
    type: "website",
    url: "https://nextjudge.net",
    siteName: "NextJudge",
    locale: "en_US",
    countryName: "United States",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextJudge - Host Competitive Programming Contests with Ease",
    description: "NextJudge is a competitive programming platform built for the modern era. It is designed to be easy to use, fast, and extensible for everyone.",
    creator: "@tomnyuma",
    images: ["https://nextjudge.net/opengraph-image.webp"]
  }
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
          defaultTheme="dark"
          forcedTheme="dark"
          themes={["dark"]}
          // enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
