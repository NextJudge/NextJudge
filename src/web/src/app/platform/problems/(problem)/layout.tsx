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
      <main className="flex-1 flex flex-col w-full min-w-0">{children}</main>
    </>
  );
}
