"use client";

import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { routeList } from "@/lib/constants";
import { Menu, Pyramid } from "lucide-react";
import { MainNavigationMenu } from "../navbar";
import { ModeToggle } from "../theme";
import { Button, buttonVariants } from "../ui/button";
import { Icons } from "@/components/icons";

export default function PlatformNavbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-neutral-500/40 dark:bg-background">
      <div className="container h-14 px-4 w-screen flex justify-between">
        <div className="font-bold flex items-center mx-12 gap-4">
          <Icons.logo className="text-orange-600 w-6 h-6" />
          <a href="/" className=" font-bold text-xl">
            NextJudge
          </a>
        </div>

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

        <div className="hidden md:flex flex-row gap-4 justify-center items-center mx-12">
          <MainNavigationMenu />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
