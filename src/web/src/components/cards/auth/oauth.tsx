import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signIn } from "@/app/auth";

export function OAuthGitHub() {
  return (
    <>
      <form
        action={async () => {
          "use server";
          await signIn("github", {
            redirectTo: "/platform",
            redirect: true,
          });
        }}
      >
          <Button variant="ghost" type="submit">
        <Icons.altgithub className="mr-2 h-4 w-4" />
        GitHub
      </Button>
      </form>
    </>
  );
}
