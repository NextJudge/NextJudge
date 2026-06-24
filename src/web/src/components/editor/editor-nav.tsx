"use client";

import { Icons } from "@/components/icons";
import { MainNavigationMenu } from "@/components/nav/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routeList } from "@/lib/constants";
import { BRAND_NAME } from "@/lib/site";
import { ChevronLeft, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EditorNavbar({
  children,
  notificationSlot,
  backHref = "/platform/problems",
}: {
  children: React.ReactNode;
  notificationSlot: React.ReactNode;
  backHref?: string;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="flex w-full justify-between items-center h-12 shrink-0">
        <div className="flex items-center h-8 space-x-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 mx-2">
            <Icons.logo className="text-orange-600 w-7 h-7 shrink-0" />
            <span className="text-lg font-bold hidden sm:inline">{BRAND_NAME}</span>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={backHref} aria-label="Back to problems list">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to problems</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center h-8 space-x-1">
          <div className="hidden md:flex items-center gap-2">
            <MainNavigationMenu />
            {notificationSlot}
            {children}
          </div>

          <div className="flex md:hidden items-center gap-1">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl">{BRAND_NAME}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                  {routeList.map(({ href, label }) => {
                    const isExternal = href.startsWith("http");
                    return (
                      <a
                        key={label}
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        onClick={() => setIsOpen(false)}
                        className={buttonVariants({ variant: "ghost" })}
                      >
                        {label}
                      </a>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
