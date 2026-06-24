"use client";

import { EmailForm } from "@/components/forms/mailing-list-form";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { Session } from "next-auth";
import Link from "next/link";

type EarlyAccessProps = {
  session: Session | null;
};

export function EarlyAccess({ session }: EarlyAccessProps) {
  if (session?.user) {
    return (
      <section
        id="early-access"
        className="relative flex flex-col items-center justify-center px-4 py-20 md:py-28"
      >
        <div className="mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Welcome back
          </h2>
          <p className="mt-3 text-sm text-white/70 md:text-base">
            Jump into contests, problems, and your submissions from the platform.
          </p>
          <EnhancedButton
            asChild
            variant="expandIcon"
            Icon={ArrowRightIcon}
            iconPlacement="right"
            className="mt-8 rounded-full font-semibold"
            size="lg"
          >
            <Link href="/platform" aria-label="Go to Platform">
              Go to Platform
            </Link>
          </EnhancedButton>
        </div>
      </section>
    );
  }

  return (
    <section
      id="early-access"
      className="relative flex flex-col items-center justify-center px-4 py-16 md:py-24"
    >
      <EmailForm />
    </section>
  );
}
