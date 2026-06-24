import type { Metadata } from "next";

import { SEO_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: SEO_ROBOTS.noIndex,
};

export default function AuthLogoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
