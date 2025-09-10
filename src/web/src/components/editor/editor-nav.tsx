"use client";

import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Icons } from "@/components/icons";
import { MainNavigationMenu } from "@/components/nav/navbar";
import { ModeToggle } from "@/components/theme";
import { Button, buttonVariants } from "@/components/ui/button";
import { routeList } from "@/lib/constants";
import { Menu } from "lucide-react";
import { Session } from "next-auth";
import { NotificationBellServer } from "../ui/notification-bell-server";

// TODO: Feed these props from Zustand (global state solution)
export default function EditorNavbar({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <header className="border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-neutral-500/40 dark:bg-background">
      <div className="container h-14 px-4 w-screen flex justify-between">
        <div className="font-bold flex items-center mx-6 gap-2">
          <Icons.logo className="text-orange-600 w-6 h-6" />
          <a href="/" className="text-xl">
            NextJudge
          </a>
        </div>

        {/* <EditorThemeSelector
          onSelect={onSelect}
          themes={themes}
          selectedTheme={selectedTheme}
        /> */}

        {/* mobile */}
        <div className="flex md:hidden items-center justify-center gap-8 mx-4">
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="px-2" asChild>
              <Button variant="ghost">
                <Menu className="h-5 w-5" onClick={() => setIsOpen(true)} />
              </Button>
            </SheetTrigger>

            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                {routeList.map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={buttonVariants({ variant: "ghost" })}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex flex-row gap-4 justify-center items-center mx-12 ">
          <MainNavigationMenu />
          <NotificationBellServer session={session} />
          {children}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
