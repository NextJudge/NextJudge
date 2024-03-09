import { Metadata } from "next";

import { BreadcrumbWithDropdown } from "@/components/nav/crumb";
import { SidebarNav } from "@/components/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage your various contests, problems, and submissions.",
};

export const sidebarNavItems = [
  {
    title: "Profile",
    href: "/platform/admin",
  },
  {
    title: "Problems",
    href: "/platform/admin/problems",
  },
  {
    title: "Contests",
    href: "/platform/admin/contests",
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const links = [
  {
    label: "Admin",
    href: "/platform/admin",
    dropdown: true,
    dropdownLinks: [
      {
        label: "Profile",
        href: "/platform/admin",
      },
      {
        label: "Problems",
        href: "/platform/admin/problems",
      },
      {
        label: "Contests",
        href: "/platform/admin/contests",
      },
    ],
  },
];

export default function AdminLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      <div className="hidden space-y-6 px-10 max-w-7xl md:block w-full">
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
