import { signIn } from "@/app/auth";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function OAuthGitHub() {
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
