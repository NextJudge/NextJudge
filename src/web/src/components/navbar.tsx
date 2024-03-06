"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Menu } from "lucide-react";
import { Icons } from "./icons";
import { ModeToggle } from "./theme";
import { buttonVariants } from "./ui/button";

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: "/#features",
    label: "Features",
  },
  {
    href: "/auth/signup",
    label: "Sign Up",
  },
  {
    href: "/auth/login",
    label: "Login",
  },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-orange-700/40 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex items-center">
            <Icons.logo />
            <a href="/" className="ml-3 font-bold text-xl flex">
              NextJudge
            </a>
          </NavigationMenuItem>

          {/* mobile */}
          {isClient && (
            <div className="flex md:hidden">
              <ModeToggle />
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger className="px-2">
                  <Menu
                    className="flex md:hidden h-5 w-5"
                    onClick={() => setIsOpen(true)}
                  >
                    <span className="sr-only">Menu Icon</span>
                  </Menu>
                </SheetTrigger>

                <SheetContent side={"left"}>
                  <SheetHeader>
                    <SheetTitle className="font-bold text-xl">
                      NextJudge
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                    {routeList.map(({ href, label }: RouteProps) => (
                      <a
                        key={label}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={buttonVariants({ variant: "ghost" })}
                      >
                        {label}
                      </a>
                    ))}
                    <a
                      href="https://github.com/nextjudge/nextjudge"
                      target="_blank"
                      className={`w-[110px] border ${buttonVariants({
                        variant: "secondary",
                      })}`}
                    >
                      <GitHubLogoIcon className="mr-2 w-5 h-5" />
                      Github
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* desktop */}
          <nav className="hidden md:flex gap-4">
            {routeList.map((route: RouteProps, i) => (
              <a
                href={route.href}
                key={i}
                className={`text-[17px] ${buttonVariants({
                  variant: "ghost",
                })}`}
              >
                {route.label}
              </a>
            ))}
            <ModeToggle />
          </nav>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
