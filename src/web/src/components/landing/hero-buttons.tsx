"use client";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { Icons } from "../icons";
import { EnhancedButton } from "../ui/enhanced-button";

export default function HeroButtons() {
  const handleClick = () => {
    toast(
      "NextJudge is currently in private beta. Sign up to get early access!"
    );
  };

  const handleDocumentationClick = () => {
    window.open("https://github.com/nextjudge/nextjudge", "_blank");
  };

  return (
    <>
      <div className="flex flex-col justify-center gap-1 items-center">
        <EnhancedButton
          variant="expandIcon"
          Icon={ArrowRightIcon}
          onClick={handleClick}
          iconPlacement="right"
          className={cn("w-full md:w-4/6")}
          size={"lg"}
        >
          Get Started
        </EnhancedButton>

        <EnhancedButton
          variant="linkHover2"
          size={"lg"}
          onClick={handleDocumentationClick}
          className="w-3/6"
        >
          NextJudge on GitHub
          <Icons.github className="w-6 h-6 ml-2 mb-1" />
        </EnhancedButton>
      </div>
    </>
  );
}
