"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface VideoSkeletonProps {
  loading: boolean;
  src: string | undefined;
}

export default function VideoSkeleton({ loading, src }: VideoSkeletonProps) {
  return (
    <>
      <AnimatePresence mode="sync">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            {
              "opacity-0": loading,
              "opacity-100": !loading,
              "transition-opacity duration-500 ease-in-out": true,
            },
            "rounded-lg ring-1 ring-osu/20 dark:bg-black bg-neutral-200 min-w-[50rem] min-h-[20rem] lg:w-full lg:h-full max-w-6xl border-4 border-osu/5 p-2 shadow-osu shadow"
          )}
        >
          <video
            loop
            controls={false}
            preload="auto"
            muted
            src={src}
            playsInline
            autoPlay
            width="100%"
            height="100%"
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
