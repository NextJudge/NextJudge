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
import { Session } from "next-auth";
import { Button } from "@/components/ui/button";
import { directoryRoutes, platformRoutes, routeList } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Menu, Pyramid } from "lucide-react";
import Link from "next/link";
import { Icons } from "../icons";
import { ModeToggle } from "../theme";
import { buttonVariants } from "../ui/button";
import { UserAvatar } from "./user-avatar";

export function LandingNavbar({ session }: { session: Session | undefined }) {
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
          <Sheet>
            <SheetTrigger className="px-2" asChild>
              <Button variant="ghost" className={cn("self-end")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                <ModeToggle />
                {session?.user ? (
                  <UserAvatar session={session} />
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
                {routeList.map(({ href, label }) => (
                  <a
                    key={label}
                    href={href}
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
            {session?.user ? (
              <UserAvatar session={session} />
            ) : (
              <div className="flex items-center gap-2">
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
                      variant: "outline",
                    })}`
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </NavigationMenuItem>
        </div>
      </NavigationMenu>
    </header>
  );
}
