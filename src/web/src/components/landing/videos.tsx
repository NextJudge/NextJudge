"use client";
import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";

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
          src="/demo/demo.mp4"
          title="NextJudge Demo"
          playsInline
          typeof="video/mp4"
          autoPlay
          width="100%"
          height="100%"
        >
          <source src={"/demo/demo.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-950 to-neutral-950/5 via-neutral-950/95" /> */}
        <BorderBeam
          duration={20}
          delay={10}
          size={400}
          borderWidth={1}
        />
        <BorderBeam
          duration={20}
          size={400}
          borderWidth={1}
        />
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
          src="/demo/demo.mp4"
          playsInline
          title="NextJudge Demo"
          autoPlay
          typeof="video/mp4"
          width="100%"
          height="100%"
          className="rounded-lg border border-muted bg-white p-2 object-cover w-full h-full max-w-7xl sm:h-[300px] md:h-[400px] lg:h-full shadow-xl"
        >
          <source src={"/demo/demo.mp4"} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-100 to-neutral-100/5 via-neutral-100/95"></div> */}
        <BorderBeam
          duration={6}
          delay={3}
          size={400}
          borderWidth={2}
        />
        <BorderBeam
          duration={6}
          size={400}
          borderWidth={2}
        />
      </Card>
    </>
  );
}
