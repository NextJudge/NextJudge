"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function OAuthGitHub() {
  return (
    <>
      {/* <form
        action={async () => {
          "use server";
          await signIn("github", {
            redirectTo: "/platform",
            redirect: true,
          });
        }}
      > */}
      <Button variant="ghost" onClick={() => {
        toast.error("NextJudge is currently in private beta. Check back later!");
        return;
      }}>
        <Icons.altgithub className="mr-2 h-4 w-4" />
        GitHub
      </Button>
      {/* </form> */}
    </>
  );
}
