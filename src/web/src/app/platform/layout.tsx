import { Footer } from "@/components/footer";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "NextJudge - Platform",
  description:
    "NextJudge is a platform for competitive programming, where you can solve problems and compete with others.",
};

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";

  // Hide footer on code editor pages (problem detail pages)
  const isEditorPage = pathname.includes("/platform/problems/") && pathname.match(/\/platform\/problems\/\d+$/);

  return (
    <SessionProvider>
      <main className="flex flex-col items-center justify-center overflow-x-hidden">
        {children}
      </main>
      {!isEditorPage && <Footer />}
    </SessionProvider>
  );
}
