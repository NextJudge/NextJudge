import { PAGE_TITLES, SITE_COPY } from "@/lib/site";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: PAGE_TITLES.platform,
  description: SITE_COPY.platformDescription,
};

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function EditorLayout({ children }: PlatformLayoutProps) {
  return (
    <div className="flex-1 flex flex-col w-full min-w-0">{children}</div>
  );
}
