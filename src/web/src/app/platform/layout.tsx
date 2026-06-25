import { Footer } from "@/components/footer";
import { QueryProvider } from "@/providers/query-provider";
import { PAGE_TITLES, SITE_COPY } from "@/lib/site";
import { SEO_ROBOTS } from "@/lib/seo";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: PAGE_TITLES.platform,
  description: SITE_COPY.platformDescription,
  robots: SEO_ROBOTS.noIndex,
};

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";

  const isEditorPage =
    pathname.includes("/platform/problems/") &&
    pathname.match(/\/platform\/problems\/\d+$/);

  return (
    <SessionProvider>
      <QueryProvider>
        <main
          className={
            isEditorPage
              ? "h-screen overflow-hidden"
              : "flex flex-col items-center justify-center overflow-x-hidden"
          }
        >
          {children}
        </main>
        <Footer variant="platform" />
      </QueryProvider>
    </SessionProvider>
  );
}
