"use client";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Icons } from "../icons";
import { EnhancedButton } from "../ui/enhanced-button";

export default function HeroButtons() {
  const router = useRouter();

  const handleClick = () => {
    window.location.href = "#try-it";
  };

  const handleDocumentationClick = () => {
    if (window) {
      window.open("https://github.com/nextjudge/nextjudge", "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row">
      <EnhancedButton
        variant="expandIcon"
        Icon={ArrowRightIcon}
        onClick={handleClick}
        iconPlacement="right"
        className={cn("h-12 rounded-full px-6 font-semibold text-base")}
        size="lg"
        aria-label="Try It Now"
      >
        Try It Now
      </EnhancedButton>

      <EnhancedButton
        variant="secondary"
        size="lg"
        onClick={handleDocumentationClick}
        className="h-12 rounded-full px-5 text-base text-secondary-foreground"
        aria-label="Self-Host Your Own Instance"
      >
        Self-Host Your Own Instance
        <Icons.github className="ml-2 size-5 opacity-70" />
      </EnhancedButton>
    </div>
  );
}
