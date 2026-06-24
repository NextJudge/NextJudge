import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/app/auth";
import { BreadcrumbWithDropdown } from "@/components/nav/crumb";
import PlatformNavbar from "@/components/nav/platform-navbar";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { UserAvatar } from "@/components/nav/user-avatar";
import { Separator } from "@/components/ui/separator";
import { links, sidebarNavItems } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin",
  description: "Organizer tools for managing NextJudge contests and problems.",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  if (!session) {
    throw "You must be signed-in to view this page";
  }

  // redirect non-admin users to platform home
  if (!session.user?.is_admin) {
    redirect("/platform");
  }

  return (
    <>
      <PlatformNavbar session={session}>
        <UserAvatar session={session} />
      </PlatformNavbar>
      <div className="space-y-6 px-4 sm:px-6 md:px-10 max-w-7xl w-full py-6 md:py-10">
        <BreadcrumbWithDropdown crumbs={links} />
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Admin</h2>
          <p className="text-muted-foreground">
            Organizer tools for managing contests and the official problem set.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-6 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 min-w-0 lg:max-w-4xl">{children}</div>
        </div>
      </div>
    </>
  );
}
