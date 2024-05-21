import { Metadata } from "next";

import { BreadcrumbWithDropdown } from "@/components/nav/crumb";
import PlatformNavbar from "@/components/nav/platform-nav";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import UserAvatar from "@/components/nav/user-avatar";
import { Separator } from "@/components/ui/separator";
import { links, sidebarNavItems } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage your various contests, problems, and submissions.",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <PlatformNavbar>
        <UserAvatar />
      </PlatformNavbar>
      <div className="hidden space-y-6 px-10 max-w-7xl md:block w-full py-10">
        <BreadcrumbWithDropdown crumbs={links} />
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your various contests, problems, and submissions.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-4xl">{children}</div>
        </div>
      </div>
    </>
  );
}
