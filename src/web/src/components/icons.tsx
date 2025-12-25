import { cn } from "@/lib/utils";
import { EnterIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  HelpCircleIcon,
  Loader2Icon,
  LockIcon,
  PlayIcon,
  Shell,
  TerminalIcon,
  UsersIcon,
  XIcon,
  ExternalLinkIcon
} from "lucide-react";
import Image from "next/image";

function LogoIcon({ className }: { className?: string }) {
  return (
    <Image src="/nextjudge.png" alt="NextJudge Logo" width={48} height={48} className={cn("size-12 aspect-square", className)} />
  )
}

export const Icons = {
  logo: LogoIcon,
  github: GitHubLogoIcon,
  spinner: Shell,
  loader: Loader2Icon,
  eye: EyeIcon,
  eyeOff: EyeOffIcon,
  enter: EnterIcon,
  altgithub: IconBrandGithub,
  google: IconBrandGoogle,
  arrowLeft: ArrowLeftIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  users: UsersIcon,
  copy: CopyIcon,
  help: HelpCircleIcon,
  lock: LockIcon,
  check: CheckIcon,
  close: XIcon,
  play: PlayIcon,
  terminal: TerminalIcon,
  externalLink: ExternalLinkIcon,
};
