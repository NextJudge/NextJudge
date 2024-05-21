"use client";

import animationDataDark from "@nextjudge/lottie/code-dark.json";
import animationDataLight from "@nextjudge/lottie/code-light.json";
import Lottie from "lottie-react";

export default function Code() {
  return (
    <>
      <div className="hidden dark:block">
        <Lottie
          animationData={animationDataDark}
          className="w-[200px] md:w-[400px] lg:w-[500px] object-contain"
          loop={true}
          autoPlay
        />
      </div>
      <div className="flex dark:hidden">
        <Lottie
          animationData={animationDataLight}
          className="w-[200px] md:w-[400px] lg:w-[500px] object-contain"
          loop={true}
          autoPlay
        />
      </div>
    </>
  );
}
