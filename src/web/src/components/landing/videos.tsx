"use client";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { BorderBeam } from "./beam";

export function PreviewVideo() {
  return (
    <>
      {/* Preview TODO: Consider if VideoSkeleton is necessary here.*/}
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
          src="/demo/new-dark.webm"
          title="NextJudge Demo"
          playsInline
          typeof="video/webm"
          autoPlay
          width="100%"
          height="100%"
        >
          <source src={"/demo/new-dark.webm"} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-950 to-neutral-950/5 via-neutral-950/95" /> */}
        <BorderBeam />
      </Card>
      <Card
        className={cn(
          "relative flex dark:hidden flex-col items-center justify-center bg-white border-muted rounded-lg min-w-7xl"
        )}
      >
        <video
          loop
          controls={false}
          preload="auto"
          muted
          src="/demo/new-light.webm"
          playsInline
          title="NextJudge Demo"
          autoPlay
          typeof="video/webm"
          width="100%"
          height="100%"
          className="rounded-lg border border-muted bg-white p-2 object-cover w-full h-full max-w-7xl sm:h-[300px] md:h-[400px] lg:h-full shadow-xl"
        >
          <source src={"/demo/new-light.webm"} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-100 to-neutral-100/5 via-neutral-100/95"></div> */}
        <BorderBeam />
      </Card>
    </>
  );
}
