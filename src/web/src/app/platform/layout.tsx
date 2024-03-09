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

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <>
      <PlatformNavbar />
      <main className="flex flex-row items-center justify-center overflow-x-hidden py-10">
        {children}
      </main>
    </>
  );
}
