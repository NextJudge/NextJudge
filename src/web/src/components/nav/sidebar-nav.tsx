"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { match, P } from "ts-pattern";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  // this is to support cases like /platform/admin/problems/ and /platform/admin/contests/
  // for active item and really highlighting for any level of sub-items
  const isActive = (itemHref: string) => {
    return match({ pathname, itemHref, items })
      .with({ pathname: P.string.select() }, (currentPath) =>
        match(currentPath)
          .when(path => path === itemHref, () => true)
          .when(path => path.startsWith(`${itemHref}/`), () => {
            const matchingItems = items.filter(item =>
              currentPath === item.href || currentPath.startsWith(`${item.href}/`)
            );
            const mostSpecific = matchingItems.reduce((prev, current) =>
              current.href.length > prev.href.length ? current : prev
            );
            return mostSpecific.href === itemHref;
          })
          .otherwise(() => false)
      )
      .otherwise(() => false);
  };

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            isActive(item.href)
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
