import { LoginCard } from "@/components/cards/auth/login";
import { OAuthGitHub } from "@/components/cards/auth/oauth";
import { cn } from "@/lib/utils";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <LoginCard>
        {/* Each child represents an OAuth integration btn/form */}
        <OAuthGitHub />
      </LoginCard>
    </div>
  );
}
