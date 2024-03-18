import { Button, buttonVariants } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { cn } from "../../lib/utils";
import HeroButtons from "./hero-buttons";

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
        <HeroButtons />
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
