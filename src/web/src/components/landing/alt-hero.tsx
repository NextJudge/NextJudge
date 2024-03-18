import { Button, buttonVariants } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";

export function AltHero() {
  return (
    <section className="container grid lg:grid-cols-1 place-items-center py-12 lg:py-14 gap-10">
      <div className="text-center space-y-4">
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

        <div className="space-y-4 md:space-x-4 max-w-64 mx-auto md:max-w-full">
          <a href="/platform">
            <Button
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
          </a>
          <a
            href="https://github.com/nextjudge/nextjudge"
            target="_blank"
            className={`w-full md:w-1/3 dark:bg-neutral-800 ${buttonVariants({
              variant: "secondary",
            })} ring-1 ring-black hover:bg-neutral-300 dark:hover:bg-neutral-800/80`}
          >
            Documentation
            <GitHubLogoIcon className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Preview TODO: Consider if VideoSkeleton is necessary here.*/}
      <div className="mt-4 hidden dark:block max-w-6xl">
        <video
          loop
          controls={false}
          className="rounded-lg ring-1 ring-osu/20 border border-black bg-neutral-950 p-2 min-w-full min-h-[40rem] shadow-osu shadow"
          preload="auto"
          muted
          src="/demo/dark.mov"
          playsInline
          autoPlay
          width="100%"
          height="100%"
        >
          <source src={"/demo/dark.mov"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="mt-4 block dark:hidden max-w-6xl">
        <video
          loop
          controls={false}
          preload="auto"
          muted
          src="/demo/light.mov"
          playsInline
          autoPlay
          width="100%"
          height="100%"
          className="rounded-lg ring-1 ring-osu/20 border border-orange-600/20 bg-neutral-100/20 p-1 min-w-full min-h-[40rem] shadow-osu shadow"
        >
          <source src={"/demo/light.mov"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
