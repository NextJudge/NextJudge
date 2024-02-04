import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

import World from "@/components/globe";

export default function ParallaxSection() {
  const controls = useAnimation();
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const controls2 = useAnimation();
  const { ref: ref2, inView: inView2 } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const controls3 = useAnimation();
  const { ref: ref3, inView: inView3 } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  //   useLayoutEffect(() => {
  //     const section1 = document.getElementById("section1");
  //     const section2 = document.getElementById("section2");
  //     const section3 = document.getElementById("section3");

  //     // THIS IS THE FIIRST MOUNT, SO DETERMINE WHERE THEY ARE
  //     const currentScrollPos = window.scrollY;
  //     const section1Pos = section1?.offsetTop;
  //     const section2Pos = section2?.offsetTop;
  //     const section3Pos = section3?.offsetTop;

  //     // depending on where they are, show or hide the content
  //     if (currentScrollPos < section2Pos!) {
  //       controls.start("visible");
  //       controls2.start("hidden");
  //       controls3.start("hidden");
  //     }

  //     if (currentScrollPos > section2Pos! && currentScrollPos < section3Pos!) {
  //       controls.start("hidden");
  //       controls2.start("visible");
  //       controls3.start("hidden");
  //     }

  //     if (currentScrollPos > section3Pos!) {
  //       controls.start("hidden");
  //       controls2.start("hidden");
  //       controls3.start("visible");
  //     }

  //     // Depoending on where they are, smooth scroll to ref of the closest section
  //     if (currentScrollPos < section2Pos!) {
  //       window.scrollTo({
  //         top: section1Pos,
  //         behavior: "smooth",
  //       });
  //     }

  //     if (currentScrollPos > section2Pos! && currentScrollPos < section3Pos!) {
  //       window.scrollTo({
  //         top: section2Pos,
  //         behavior: "smooth",
  //       });
  //     }

  //     if (currentScrollPos > section3Pos!) {
  //       window.scrollTo({
  //         top: section3Pos,
  //         behavior: "smooth",
  //       });
  //     }
  //   }, [controls, controls2, controls3]);

  useEffect(() => {
    if (inView) {
      controls.start("visible");
      controls2.start("hidden");
    }

    if (inView2) {
      controls2.start("visible");
      controls.start("hidden");
    }

    if (inView3) {
      controls3.start("visible");
      controls.start("hidden");
    }
  }, [controls, inView, controls2, inView2, controls3, inView3]);

  return (
    <div className="max-w-screen container relative flex min-h-screen flex-col items-center justify-center gap-64 px-4 py-6 md:px-6 md:pt-24 lg:pt-24 xl:pt-24">
      <motion.div
        id="section1"
        ref={ref}
        animate={controls}
        initial={inView ? "visible" : "hidden"}
        variants={{
          visible: { opacity: 1, transition: { duration: 0.3 } },
          hidden: { opacity: 0, transition: { duration: 0.3 } },
        }}
        className="sticky top-0 z-10 ml-12 flex flex-col items-center pt-32"
      >
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
          What's NextJudge?
        </h1>
      </motion.div>

      <motion.div
        id="section2"
        ref={ref2}
        animate={controls2}
        initial="hidden"
        variants={{
          visible: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } },
          hidden: { opacity: 0, transition: { duration: 0.5, delay: 0.5 } },
        }}
        className="flex flex-col items-center"
      >
        <p className="mx-auto max-w-3xl text-center text-xl font-bold tracking-tighter sm:text-2xl xl:text-5xl">
          Imagine a world where you can compete with your friends in a
          programming contest without worrying about the infrastructure.
        </p>

        <World />

        <div className="flex  flex-col items-center gap-96 py-32">
          <p className="mx-auto max-w-lg text-center text-xl font-bold tracking-tighter sm:text-2xl xl:text-5xl">
            Hundreds of curated coding problems....
          </p>

          <p className="mx-auto min-w-full text-center text-xl font-bold tracking-tighter sm:text-2xl xl:text-5xl">
            Contests, Leaderboards, Ranks....
          </p>

          <p className="mx-auto max-w-lg text-center text-xl font-bold tracking-tighter sm:text-2xl xl:text-5xl">
            All in one place.
          </p>
          <p className="mx-auto max-w-lg text-center text-xl font-bold tracking-tighter sm:text-2xl xl:text-5xl">
            We created NextJudge to make this world a reality.
          </p>
        </div>
      </motion.div>

      <motion.div
        id="section3"
        ref={ref3}
        animate={controls3}
        initial="hidden"
        variants={{
          visible: { opacity: 1, transition: { duration: 0.3, delay: 0.5 } },
          hidden: { opacity: 0, transition: { duration: 0.3, delay: 0.5 } },
        }}
        className="flex flex-col items-center pb-64"
      >
        <button
          id="underline"
          className="relative bg-gradient-to-r from-purple-600/70 to-blue-600/70 bg-clip-text text-7xl font-bold tracking-tighter text-transparent transition-all duration-500 ease-in-out hover:rotate-1 hover:scale-105 hover:cursor-pointer hover:shadow-2xl hover:saturate-200 hover:backdrop-blur-3xl hover:backdrop-brightness-125 hover:backdrop-contrast-100 hover:backdrop-hue-rotate-180 hover:backdrop-opacity-50 hover:backdrop-saturate-200 sm:text-3xl xl:text-7xl"
          onClick={() => window.open("/auth", "_self")}
        >
          Join the movement.
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-600/70 to-blue-600/70"></span>
        </button>
      </motion.div>
    </div>
  );
}
