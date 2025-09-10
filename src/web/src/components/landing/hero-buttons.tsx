"use client";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Icons } from "../icons";
import { EnhancedButton } from "../ui/enhanced-button";

export default function HeroButtons() {
  const router = useRouter();
  router.prefetch("/auth/signup");

  const handleClick = () => {
    router.push("/auth/signup");
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
          className={cn("w-full md:w-4/6 font-semibold text-lg")}
          size={"lg"}
        >
          Join the Arena
        </EnhancedButton>

        <EnhancedButton
          variant="linkHover2"
          size={"lg"}
          onClick={handleDocumentationClick}
          className="w-3/6 mt-2"
        >
          Host NextJudge Yourself!
          <Icons.github className="w-6 h-6 ml-2 mb-1 opacity-70" />
        </EnhancedButton>
      </div>
    </>
  );
}
