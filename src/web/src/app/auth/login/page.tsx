import { LoginCard } from "@/components/auth-form";
import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/theme";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";
import OAuthGitHub from "../signup/form";
import Code from "./code";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication forms built using the components.",
};

export default function LoginPage() {
  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <ModeToggle />
      </div>
      <div className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {/* Login Form */}
            <LoginCard>
              <OAuthGitHub />
            </LoginCard>
          </div>
        </div>
        <div className="relative hidden h-full flex-col px-10 pt-10 dark:text-white text-black lg:flex dark:border-r ">
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ variant: "link" }),
              "absolute right-4 top-4 md:right-8 md:top-8 z-50 dark:text-white text-black"
            )}
          >
            Sign Up
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
