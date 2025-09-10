import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextJudge - Elevate your coding skills to the next level.",
  description:
    "An all-new competitive programming platform built for organizers, developers, and participants.",
  openGraph: {
    type: "website",
    url: "https://nextjudge.vercel.app/",
    title: "NextJudge - Elevate your coding skills to the next level.",
    description:
      "An all-new competitive programming platform built for organizers, developers, and participants.",
    siteName: "NextJudge",
    images: [
      {
        url: "https://nextjudge.vercel.app/og.png",
        secureUrl: "https://nextjudge.vercel.app/og.png",
        width: 2880,
        height: 1612,
        alt: "NextJudge - Elevate your coding skills to the next level.",
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
            src="https://cloud.umami.is/script.js"
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
