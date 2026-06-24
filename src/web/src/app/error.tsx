"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          An unexpected error occurred. You can try again or return to a safe
          page.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className={buttonVariants({ variant: "default" })}
            onClick={reset}
          >
            Try again
          </button>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Return to home
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "link" }))}
            href="/platform"
          >
            Go to platform
          </Link>
        </div>
      </div>
    </main>
  );
}
