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
                  <button className="scale-90 ring-1 ring-white/60 no-underline group cursor-pointer relative shadow-2xl shadow-orange-600/50 rounded-full p-px text-xs font-semibold leading-6  dark:text-white inline-block">
                    <span className="absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(220,68,5,0.3)_0%,rgba(0,0,0,0.5)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
      {/* Preview TODO: Consider if VideoSkeleton is necessary here.*/}
      {/* <div className="mt-4 hidden dark:block max-w-6xl"> */}
      <Card
        className={cn(
          "hidden relative dark:flex flex-col items-center dark:justify-center bg-neutral-950 border-muted rounded-lg min-w-7xl"
        )}
      >
        <video
          loop
          controls={false}
          className="rounded-lg border border-muted bg-neutral-950 p-2 object-cover w-full h-full max-w-7xl sm:h-[300px] md:h-[400px] lg:h-full shadow-osu"
          preload="auto"
          muted
          src="/demo/dark.mp4"
          title="NextJudge Demo"
          playsInline
          typeof="video/mp4"
          autoPlay
          width="100%"
          height="100%"
        >
          <source src={"/demo/dark.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-950 to-neutral-950/5 via-neutral-950/95" />
        <BorderBeam />
      </Card>
      <Card className={cn("relative flex dark:hidden flex-col items-center")}>
        <video
          loop
          controls={false}
          preload="auto"
          muted
          src="/demo/light.mp4"
          playsInline
          title="NextJudge Demo"
          autoPlay
          typeof="video/mp4"
          width="100%"
          height="100%"
          className="rounded-lg border border-muted bg-white p-2 object-cover w-full h-full max-w-7xl sm:h-[300px] md:h-[400px] lg:h-full shadow-xl"
        >
          <source src={"/demo/light.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-100 to-neutral-100/5 via-neutral-100/95"></div>
        <BorderBeam />
      </Card>
    </section>
  );
}
