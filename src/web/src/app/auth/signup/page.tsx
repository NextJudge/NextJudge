import { Metadata } from "next";
import Link from "next/link";

import { UserAuthFormSignUp } from "@/components/auth-form";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function SignUpPage() {
  return (
    <>
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign up to get started with NextJudge
              </p>
            </div>
            {/* Sign Up Form */}
            <UserAuthFormSignUp />
          </div>
        </div>
        <div className="relative hidden h-full flex-col bg-muted px-10 pt-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900 h-[100dvh]" />
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "absolute right-4 top-4 md:right-8 md:top-8 z-50 dark:text-white text-white"
            )}
          >
            Already have an account? Login
          </Link>
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Icons.logo className="mr-2 h-6 w-6" />
            NextJudge
          </div>
          <div id="card-panel" className="relative z-20 mt-auto">
            <div className="flex flex-col space-y-6 text-center max-w-xl mx-auto">
              <h1 className="text-3xl font-semibold tracking-tight">
                Join the next generation of competitive programming platforms.
              </h1>
              <h3 className="text-lg text-neutral-400 font-semibold tracking-tight">
                Next Judge is releasing in the coming months.
              </h3>
              <a
                href="https://github.com/nextjudge/nextjudge"
                className="text-xs text-muted-foreground hover:underline hover:text-orange-600"
              >
                Learn more
              </a>
            </div>
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
