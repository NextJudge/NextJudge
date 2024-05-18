"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { directoryRoutes, platformRoutes, routeList } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Menu, Pyramid } from "lucide-react";
import Link from "next/link";
import { Icons } from "../icons";
import { ModeToggle } from "../theme";
import { buttonVariants } from "../ui/button";

// TODO: Refactor this into separate files, it's currently messy.
export function Navbar() {
  const [pin] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pin = localStorage.getItem("pin");
      if (pin) {
        localStorage.setItem("pin", pin);
      }
    }
  }, []);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <header className="sticky md:relative top-0 z-40 max-w-7xl mx-auto w-screen bg-transparent backdrop-blur-lg flex justify-between items-center p-8">
      <NavigationMenu
        className={cn("flex justify-between items-center w-full max-w-full")}
      >
        <div className="flex justify-start align-middle items-center w-full">
          <Icons.logo className="text-orange-600 translate-y-[0.8px]" />
          <Link href="/" passHref className="ml-3 text-xl">
            NextJudge
          </Link>
        </div>
        {/* mobile */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="px-2" asChild>
              <Button variant="ghost" className={cn("self-end")}>
                <Menu className="h-5 w-5" onClick={() => setIsOpen(true)} />
              </Button>
            </SheetTrigger>

            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                <ModeToggle />
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
        {/* desktop */}
        <NavigationMenuList className="hidden md:flex justify-center items-center w-full">
          {routeList.map((route, i) => (
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
        </NavigationMenuList>
        <div className="hidden md:flex justify-end w-full">
          <NavigationMenuItem className="flex items-center justify-end gap-4">
            <ModeToggle />
            <div className="flex items-center gap-0">
              <Link
                href="/auth/login"
                className={cn(
                  `text-base text-black dark:text-white ${buttonVariants({
                    variant: "link",
                  })}`
                )}
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className={cn(
                  `text-base text-black dark:text-white ${buttonVariants({
                    variant: "link",
                  })}`
                )}
              >
                Sign Up
              </Link>
            </div>
          </NavigationMenuItem>
        </div>
      </NavigationMenu>
    </header>
  );
}

export function MainNavigationMenu() {
  const infos = directoryRoutes.infosNav[0];
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{infos.title}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <a
                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  href={`/platform/problems/${crypto.randomUUID()}`}
                >
                  <Pyramid className="w-10 h-10" />
                  <div className="mb-2 mt-3 text-lg font-medium text-gradient_blaze-orange">
                    Jump right in!
                  </div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Go straight to our first problem and start solving!
                  </p>
                </a>
              </li>
              {infos.items?.map((info) => (
                <li key={info.title}>
                  <ListItem key={info.title} {...info} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {/* holy hack */}
        {platformRoutes.map((link) => (
          <NavigationMenuItem key={link.label}>
            <a href={link.href} className={navigationMenuTriggerStyle()}>
              {link.label}
            </a>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem: React.FC<any> = ({
  title,
  href,
  description,
  disabled,
  external,
}) => {
  const target = external ? "_blank" : undefined;

  return (
    <a
      href={disabled ? undefined : href}
      target={target}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        disabled
          ? "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
          : ""
      )}
    >
      <div className="flex items-center justify-between">
        <span className="mr-2">{title}</span>
      </div>
      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        {description}
      </p>
    </a>
  );
};

ListItem.displayName = "ListItem";

export function PlatformNavbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-neutral-500/40 dark:bg-background">
      <div className="container h-14 px-4 w-screen flex justify-between ">
        <div className="font-bold flex items-center">
          <Pyramid className="w-10 h-10" />
          <a href="/" className="ml-3 font-bold text-xl flex">
            NextJudge
          </a>
        </div>
        <div className="flex md:hidden">
          <ModeToggle />
          {/* mobile */}
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

        <div className="hidden md:flex gap-4 justify-center items-center">
          <MainNavigationMenu />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
