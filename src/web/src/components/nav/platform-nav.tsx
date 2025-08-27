
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Icons } from "@/components/icons";
import { platformRoutes } from "@/lib/constants";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { ModeToggle } from "../theme";
import { Button, buttonVariants } from "../ui/button";
import { NotificationBell } from "../ui/notification-bell";
import { MainNavigationMenu } from "./navbar";

export default function PlatformNavbar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const filteredPlatformRoutes = platformRoutes.filter((route) => {
    if (route.href.includes('/admin')) {
      return session?.user?.is_admin === true;
    }
    return true;
  });

  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-neutral-500/40 dark:bg-background">
      <div className="container h-14 px-4 w-screen flex justify-between">
        <div className="font-bold flex items-center mx-2 md:mx-12 gap-4">
          <Icons.logo className="text-orange-600 w-6 h-6" />
          <a href="/" className=" font-bold text-xl">
            NextJudge
          </a>
          <span className="hidden md:block">
            <ModeToggle />
          </span>
        </div>

        {/* mobile */}
        <div className="flex md:hidden items-center justify-center gap-8 mx-4">
          <NotificationBell />
          <Sheet>
            <SheetTrigger className="px-2" asChild>
              <Button variant="ghost">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                {children}
                <ModeToggle />
                {filteredPlatformRoutes.map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className={buttonVariants({ variant: "ghost" })}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex flex-row gap-4 justify-center items-center mx-12">
          <MainNavigationMenu />
          {children}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
