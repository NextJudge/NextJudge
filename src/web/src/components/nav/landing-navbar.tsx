import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { routeList } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Menu } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import { Icons } from "../icons";
import { ModeToggle } from "../theme";
import { buttonVariants } from "../ui/button";
import { UserAvatar } from "./user-avatar";

export function LandingNavbar({ session }: { session: Session | undefined }) {

  return (
    <header className="absolute left-0 right-0 top-0 z-40 mx-auto max-w-7xl px-6 py-6 lg:px-12">
      <NavigationMenu
        className={cn("flex justify-between items-center w-full max-w-full")}
      >
        <div className="flex justify-start align-middle items-center w-full">
          <Icons.logo className="text-orange-600 translate-y-[0.8px]" />
          <Link href="/" passHref className="ml-3 text-xl text-white dark:text-white" aria-label="NextJudge">
            <span className="sr-only">NextJudge</span>
            NextJudge
          </Link>
        </div>
        {/* mobile */}
        <div className="flex md:hidden">
          <Sheet>
            <SheetTrigger className="px-2" asChild>
              <Button variant="ghost" className="self-end text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                {session?.user ? (
                  <UserAvatar session={session} />
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className={buttonVariants({ variant: "link" })}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className={buttonVariants({ variant: "link" })}
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
                <ModeToggle />
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
              className={cn(
                "text-[17px] text-white/90 hover:text-white hover:bg-white/10",
                buttonVariants({ variant: "ghost" })
              )}
            >
              {route.label}
            </a>
          ))}
        </NavigationMenuList>
        <div className="hidden md:flex justify-end w-full">
          <NavigationMenuItem className="flex items-center justify-end gap-4">
            {session?.user ? (
              <UserAvatar session={session} />
            ) : (
              <div className="flex items-center gap-2">
                  <Link
                    aria-label="Login"
                  href="/auth/login"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "text-white/90 hover:text-white"
                  )}
                >
                  Login
                </Link>
                <Link
                  aria-label="Sign Up"
                  href="/auth/signup"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "text-white/90 hover:text-white"
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}
            <ModeToggle />
          </NavigationMenuItem>
        </div>
      </NavigationMenu>
    </header>
  );
}
