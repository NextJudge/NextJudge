import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import { createRootMetadata } from "@/lib/seo";
import { QueryProvider } from "@/providers/query-provider";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = createRootMetadata();

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
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
