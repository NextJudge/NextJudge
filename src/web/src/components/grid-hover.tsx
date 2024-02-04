import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { features } from "../lib/data";

export const HoverEffect = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-8">
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {features.map((project, idx) => (
          <div
            key={project?.id}
            className="group relative  block h-full w-full p-2 "
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className="absolute inset-0 block h-full w-full rounded-3xl  bg-slate-800/[0.8]"
                  layoutId="hoverBackground" // required for the background to follow
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <div className="relative z-50 h-full w-full overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-purple-600/30 to-blue-600/30 group-hover:from-purple-700/70 group-hover:to-blue-700/70">
              <div className="relative z-50">
                <div className="p-4">
                  <h4 className="mt-4 font-bold tracking-wide text-zinc-100">
                    {project.title}
                  </h4>
                  <p className="mt-8 text-sm leading-relaxed tracking-wide text-zinc-400">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
