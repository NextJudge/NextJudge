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
      <main className="flex flex-col items-center justify-center overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
