"use client";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useWindowSize } from "react-use";
import { Icons } from "../icons";
import { EnhancedButton } from "../ui/enhanced-button";

export default function HeroButtons() {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const handleClick = () => {
    window.location.href = "#try-it";
  };

  const handleDocumentationClick = () => {
    if (window) {
      window.open("https://docs.nextjudge.net", "_blank");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row">
      <EnhancedButton
        variant="expandIcon"
        Icon={ArrowRightIcon}
        onClick={handleClick}
        iconPlacement="right"
        className={cn(
          "rounded-full font-semibold",
          isMobile ? "h-10 px-4 text-sm" : "h-12 px-6 text-base"
        )}
        size={isMobile ? "sm" : "lg"}
        aria-label="Try It Now"
      >
        Try It Now
      </EnhancedButton>

      <EnhancedButton
        variant="secondary"
        size={isMobile ? "sm" : "lg"}
        onClick={handleDocumentationClick}
        className={cn(
          "rounded-full text-secondary-foreground hover:underline",
          isMobile ? "h-10 px-4 text-sm" : "h-12 px-5 text-base"
        )}
        aria-label="NextJudge Documentation"
      >
        Documentation
        <Icons.externalLink className={cn("ml-2 opacity-70", isMobile ? "size-4" : "size-5")} />
      </EnhancedButton>
    </div>
  );
}
