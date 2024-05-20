import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { BorderBeam } from "./beam";
import HeroButtons from "./hero-buttons";
import { PreviewVideo } from "./videos";

export function AltHero() {
  return (
    <section className="container relative grid lg:grid-cols-1 place-items-center py-2 md:py-8 lg:pt-4 gap-10">
      <TooltipProvider>
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center">
            <a href="#early-access">
              <Tooltip delayDuration={0}>
                <TooltipContent
                  side="right"
                  className={cn("text-sm", "scale-90")}
                  sideOffset={5}
                >
                  <p className="text-sm">
                    <span className="font-semibold">Click here</span> to join
                    the waitlist for early access.
                    <br />
                  </p>
                </TooltipContent>
                <TooltipTrigger asChild>
                  <button className="scale-90 ring-1 ring-neutral-300/60 no-underline group cursor-pointer relative shadow-2xl shadow-orange-600/50 rounded-full p-px text-xs font-semibold leading-6  dark:text-white inline-block">
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute inset-0 rounded-full shadow-lg bg-neutral-200 dark:bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(220,68,5,0.3)_0%,rgba(0,0,0,0.5)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </span>
                    <div className="relative flex space-x-2 items-center z-10 rounded-full py-0.5 px-4 ring-1 ring-white/10 ">
                      <span>We're launching soon!</span>
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.75 8.75L14.25 12L10.75 15.25"
                          stroke="#dc4405"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-orange-600/0 via-orange-600/90 to-orange-600/0 transition-opacity duration-500 group-hover:opacity-40" />
                  </button>
                </TooltipTrigger>
              </Tooltip>
            </a>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium font-sans">
            Elevate your coding skills <br /> to the
            <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic">
              {" "}
              next level.
            </span>
          </h1>

          <p className="text-muted-foreground max-w-sm md:max-w-xl font-medium mx-auto mt-2">
            Meet the next generation platform for competitive programming.
            Beautiful out of the box, extensible, and optimized for maximum
            performance.
          </p>
          <HeroButtons />
        </div>
      </TooltipProvider>
      <PreviewVideo />
    </section>
  );
}
