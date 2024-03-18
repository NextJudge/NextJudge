"use client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export default function HeroButtons() {
  const handleClick = () => {
    toast(
      "NextJudge is currently in private beta. Sign up to get early access!"
    );
  };

  //TODO: fix hover on button to be more consistent
  return (
    <>
      <div className="space-y-4 md:space-x-4 max-w-64 mx-auto md:max-w-full">
        <Button
          onClick={handleClick}
          className={cn(
            buttonVariants({
              variant: "secondary",
            }),
            "w-full group md:w-1/3 p-[1px] overflow-hidden relative bg-secondary hover:bg-secondary rounded-md"
          )}
        >
          <span className="absolute inset-[-1000%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_0%_50%,#000000_0%,#000000_90%,#EA580C_100%)] bg-clip-padding" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center bg-secondary group-hover:bg-neutral-300 transition-colors dark:group-hover:bg-[#1f1f1f]  dark:bg-neutral-800 rounded text-sm font-medium text-primary dark:text-white backdrop-blur-3xl">
            Get Started
          </span>
        </Button>

        <a
          href="https://github.com/nextjudge/nextjudge"
          target="_blank"
          className={`w-full md:w-1/3 dark:bg-neutral-800 ${buttonVariants({
            variant: "secondary",
          })} ring-1 ring-black hover:bg-neutral-00 dark:hover:bg-[#1f1f1f]`}
        >
          Documentation
          <GitHubLogoIcon className="ml-2 w-5 h-5" />
        </a>
      </div>
    </>
  );
}
