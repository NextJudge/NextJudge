import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextJudge - Elevate your coding skills to the next level.",
  description:
    "An all-new, competitive programming platform built for organizers, developers, and participants.",
  openGraph: {
    type: "website",
    url: "https://nextjudge.vercel.app/",
    title: "NextJudge - Elevate your coding skills to the next level.",
    description:
      "An all-new, competitive programming platform built for organizers, developers, and participants.",
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
    <html lang="en">
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
