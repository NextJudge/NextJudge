"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Card } from "../ui/card";
import { BorderBeam } from "./beam";

export function PreviewVideo() {
  const [loading, setLoaded] = useState(false);
  return (
    <>
         <Card
        className={cn(
          "relative hidden dark:flex flex-col items-center bg-neutral-950 w-full rounded-lg shadow-osu"
        )}
      >
        <video
          loop
          controls={false}
          className="rounded-lg border border-black bg-neutral-950 p-2 object-cover w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-full shadow"
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
        <BorderBeam />
        {/* Gradient Mask */}
        {/* <div className="absolute bottom-0 left-0 w-full h-4/5 bg-gradient-to-t from-neutral-950 to-neutral-950/5 via-neutral-950/95" /> */}
      </Card>
      <Card className={cn("relative flex dark:hidden flex-col items-center")}>
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
          className="rounded-lg object-contain w-full sm:h-[300px] md:h-[400px] xl:h-[600px] max-xl:h-full shadow"
        >
          <source src={"/demo/new-light.webm"} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {/* Gradient Mask */}
        {/* <div className="absolute bottom-0 left-0 w-full h-4/5 bg-gradient-to-t from-neutral-100 to-neutral-100/5 via-neutral-100/95"></div> */}
      </Card>
    </>
  );
}
