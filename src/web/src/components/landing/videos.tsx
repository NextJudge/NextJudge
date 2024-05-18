"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Card } from "../ui/card";
import { BorderBeam } from "./beam";

export function PreviewVideo() {
  const [loading, setLoaded] = useState(false);
  const [loading2, setLoaded2] = useState(false);
  return (
    <>
      {/* Preview TODO: Consider if VideoSkeleton is necessary here.*/}
      {/* <div className="mt-4 hidden dark:block max-w-6xl"> */}
      <Card
        className={cn(
          "relative hidden dark:flex flex-col items-center bg-neutral-950 min-w-7xl"
        )}
      >
        <AnimatePresence mode="sync">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn({
              "opacity-0": loading,
              "opacity-100": !loading,
              "transition-opacity duration-500 ease-in-out": true,
            })}
          >
            <video
              loop
              controls={false}
              preload="auto"
              className="rounded-lg border border-muted bg-neutral-950 p-2 object-cover w-full h-full max-w-7xl sm:h-[300px] md:h-[400px] lg:h-full shadow-osu"
              muted
              src="/demo/new-dark.webm"
              title="NextJudge Demo"
              playsInline
              typeof="video/webm"
              autoPlay
              width="100%"
              height="100%"
              onLoad={() => setLoaded(true)}
            >
              <source src="/demo/dark.webm" type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </AnimatePresence>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-950 to-neutral-950/5 via-neutral-950/95" /> */}
        <BorderBeam />
      </Card>
      <Card
        className={cn(
          "relative flex dark:hidden flex-col items-center justify-center bg-white border-muted rounded-lg min-w-7xl sm:h-[300px] md:h-[400px] lg:h-full"
        )}
      >
        <AnimatePresence mode="sync">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={cn({
              "opacity-0": loading,
              "opacity-100": !loading,
              "transition-opacity duration-500 ease-in-out": true,
            })}
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
              onLoad={() => setLoaded2(true)}
            >
              <source src={"/demo/light.webm"} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </AnimatePresence>
        {/* Gradient Mask */}
        {/* <div className="hidden md:block absolute bottom-0 left-0 w-full h-5/6 bg-gradient-to-t from-neutral-100 to-neutral-100/5 via-neutral-100/95"></div> */}
        <BorderBeam />
      </Card>
    </>
  );
}
