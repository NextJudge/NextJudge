import * as React from "react";

import { cn } from "@/lib/utils";

import { signIn } from "@/app/auth";
import { Icons } from "@/components/icons";
import { UserAuthForm } from "@/components/landing/email-form";
import { Button } from "@/components/ui/button";

interface SignUpCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignUpCard({ className, ...props }: SignUpCardProps) {
  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <UserAuthForm>
        {/* Each child represents an OAuth Server Component Form */}
        <OAuthGitHub />
      </UserAuthForm>
    </div>
  );
}

export default function OAuthGitHub() {
  return (
    <>
      <form
        action={async () => {
          "use server";
          await signIn("github", {
            redirectTo: "/platform",
          });
        }}
      >
        <Button variant="outline" type="submit">
          <Icons.altgithub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </form>
    </>
  );
}
