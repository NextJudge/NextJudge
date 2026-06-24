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

            <SheetContent side={"left"} className="flex flex-col h-full w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left px-1 border-b pb-4">
                <div className="flex items-center gap-2">
                  <Icons.logo className="size-8" />
                  <SheetTitle className="font-bold text-xl">NextJudge</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-4 py-4 flex-1">
                <nav className="flex flex-col gap-2">
                  {routeList.map(({ href, label }) => {
                    const isExternal = href.startsWith("http");
                    return (
                      <a
                        key={label}
                        href={href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full justify-start text-lg font-medium")}
                      >
                        {label}
                      </a>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-col gap-4 py-4 mt-auto border-t">
                <div className="flex flex-col gap-2">
                  {session?.user ? (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50">
                      <UserAvatar session={session} />
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">{session.user.name}</span>
                        <span className="text-muted-foreground truncate max-w-[150px]">{session.user.email}</span>
                      </div>
                    </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/auth/login"
                          className={cn(buttonVariants({ variant: "outline" }), "w-full pointer-events-none opacity-50 cursor-not-allowed")}
                          aria-disabled="true"
                        >
                          Login
                        </Link>
                        <Link
                          href="/auth/signup"
                          className={cn(buttonVariants({ variant: "default" }), "w-full bg-orange-600 hover:bg-orange-700 text-white pointer-events-none opacity-50 cursor-not-allowed")}
                          aria-disabled="true"
                        >
                          Sign Up
                        </Link>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <a
                    href="https://github.com/nextjudge/nextjudge"
                    target="_blank"
                    className={cn(buttonVariants({ variant: "ghost" }), "flex items-center gap-2 px-2")}
                  >
                    <GitHubLogoIcon className="h-5 w-5" />
                    <span>GitHub</span>
                  </a>
                  <ModeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* desktop */}
        <NavigationMenuList className="hidden md:flex justify-center items-center w-full">
          {routeList.map((route, i) => {
            const isExternal = route.href.startsWith("http");
            return (
              <a
                href={route.href}
                key={i}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={cn(
                  "text-[17px] text-white/90 hover:text-white hover:bg-white/10",
                  buttonVariants({ variant: "ghost" })
                )}
              >
                {route.label}
              </a>
            );
          })}
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
                    "text-white/90 hover:text-white pointer-events-none opacity-50 cursor-not-allowed"
                  )}
                  aria-disabled="true"
                >
                  Login
                </Link>
                <Link
                  aria-label="Sign Up"
                  href="/auth/signup"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "text-white/90 hover:text-white pointer-events-none opacity-50 cursor-not-allowed"
                  )}
                  aria-disabled="true"
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
