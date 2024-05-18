import { signOut } from "@/app/auth";
import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/theme";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Code from "../login/code";

export default async function SignOutPage() {
  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <ModeToggle />
      </div>
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {/* Sign Out Confirm Form */}
            <form
              action={async (formData) => {
                "use server";
                await signOut({ redirectTo: "/auth/login", redirect: true });
              }}
            >
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Sign out</CardTitle>
                  <CardDescription>
                    Terminate your session with NextJudge
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" type="submit">
                    Sign out
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
        <div className="relative hidden h-full flex-col px-10 pt-10 dark:text-white text-black lg:flex dark:border-r ">
          <Link
            href="/platform"
            className={cn(
              buttonVariants({ variant: "link" }),
              "absolute right-4 top-4 md:right-8 md:top-8 z-50 dark:text-white text-black"
            )}
          >
            Nevermind.
          </Link>
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Icons.logo className="mr-2 h-6 w-6" />
            NextJudge
          </div>
          <div id="lottie-panel" className="relative z-20 mt-auto">
            <Code />
          </div>
          <div className="relative z-20 mt-auto">
            <p className="text-xs text-muted-foreground">
              © 2024 NextJudge. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}