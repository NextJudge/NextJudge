import { Metadata } from "next";

import { auth } from "@/app/auth";
import { BreadcrumbWithDropdown } from "@/components/nav/crumb";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { UserAvatar } from "@/components/nav/user-avatar";
import { Separator } from "@/components/ui/separator";
import { settingsLinks, settingsNavItems } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your personal settings and preferences.",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await auth();

  if (!session) {
    throw "You must be signed-in to view this page";
  }

  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
      </PlatformNavbar>
      <div className="hidden space-y-6 px-10 max-w-7xl md:block w-full py-10">
        <BreadcrumbWithDropdown crumbs={settingsLinks} />
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your personal settings and preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={settingsNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-4xl">{children}</div>
        </div>
      </div>
    </>
  );
}
