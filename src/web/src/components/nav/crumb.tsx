"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, SlashIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";

interface Crumb {
  label: string;
  href: string;
  dropdown?: boolean;
  dropdownLinks?: { label: string; href: string }[];
}

interface CrumbProps {
  crumbs: Crumb[];
}

const renderBreadcrumbItem = (
  label: string,
  href: string,
  dropdownLinks?: { label: string; href: string }[]
) => {
  if (dropdownLinks && dropdownLinks.length > 0) {
    return (
      <BreadcrumbItem key={label}>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1">
            {label}
            <ChevronDownIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {dropdownLinks.map((link) => (
              <DropdownMenuItem key={link.label}>
                <a href={link.href}>{link.label}</a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
    );
  } else {
    return (
      <BreadcrumbItem key={label}>
        <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
      </BreadcrumbItem>
    );
  }
};

export function BreadcrumbWithDropdown({ crumbs }: CrumbProps) {
  const pathname = usePathname();
  const route = pathname?.split("/").pop() || "Settings";
  const upperCaseRoute = route.charAt(0).toUpperCase() + route.slice(1);
  const lastBreadcrumb =
    upperCaseRoute === "Admin" ? "Profile" : upperCaseRoute;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/platform">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        {crumbs.map(({ label, href, dropdownLinks }) =>
          renderBreadcrumbItem(label, href, dropdownLinks)
        )}
        <BreadcrumbSeparator>
          <SlashIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{lastBreadcrumb}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
