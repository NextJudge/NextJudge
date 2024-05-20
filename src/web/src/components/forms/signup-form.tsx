import { OAuthGitHub } from "@/components/cards/auth/oauth";
import { SignUpCard } from "@/components/cards/auth/signup";
import { cn } from "@/lib/utils";

interface SignUpFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <SignUpCard>
        {/* Each child represents an OAuth integration btn/form */}
        <OAuthGitHub />
      </SignUpCard>
    </div>
  );
}
