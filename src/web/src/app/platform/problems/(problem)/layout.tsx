import EditorNavbar from "@/components/editor-nav";
import PlatformNavbar from "@/components/nav/platform-nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NextJudge - Platform",
  description:
    "NextJudge is a platform for competitive programming, where you can solve problems and compete with others.",
};

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function EditorLayout({ children }: PlatformLayoutProps) {
  return (
    <>
      <main className="flex flex-col items-center justify-center overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
