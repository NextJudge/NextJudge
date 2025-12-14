'use client'

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import cSvg from "../../../public/icons/c.svg";
import cplusplusSvg from "../../../public/icons/cplusplus.svg";
import csharpSvg from "../../../public/icons/csharp.svg";
import golangSvg from "../../../public/icons/golang.svg";
import haskellSvg from "../../../public/icons/haskell.svg";
import javaSvg from "../../../public/icons/java.svg";
import javascriptSvg from "../../../public/icons/javascript.svg";
import kotlinSvg from "../../../public/icons/kotlin.svg";
import luaSvg from "../../../public/icons/lua.svg";
import phpSvg from "../../../public/icons/php.svg";
import pythonSvg from "../../../public/icons/python.svg";
import rubySvg from "../../../public/icons/ruby.svg";
import rustSvg from "../../../public/icons/rust.svg";
import swiftSvg from "../../../public/icons/swift.svg";
import typeScriptSvg from "../../../public/icons/typescript.svg";
import Marquee from "../ui/marquee";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import HeroButtons from "./hero-buttons";

const languageLogos = [
  { icon: pythonSvg, alt: "Python programming language logo", size: "24" },
  { icon: javascriptSvg, alt: "JavaScript programming language logo", size: "24" },
  { icon: cplusplusSvg, alt: "C++ programming language logo", size: "24" },
  { icon: golangSvg, alt: "Go programming language logo", size: "48", style: "translate-y-2" },
  { icon: haskellSvg, alt: "Haskell programming language logo", size: "24" },
  { icon: kotlinSvg, alt: "Kotlin programming language logo", size: "24" },
  { icon: csharpSvg, alt: "C# programming language logo", size: "24" },
  { icon: javaSvg, alt: "Java programming language logo", size: "24" },
  { icon: typeScriptSvg, alt: "TypeScript programming language logo", size: "24" },
  { icon: phpSvg, alt: "PHP programming language logo", size: "24" },
  { icon: swiftSvg, alt: "Swift programming language logo", size: "24" },
  { icon: rustSvg, alt: "Rust programming language logo", size: "24" },
  { icon: cSvg, alt: "C programming language logo", size: "24" },
  { icon: luaSvg, alt: "Lua programming language logo", size: "24" },
  { icon: rubySvg, alt: "Ruby programming language logo", size: "24" },
];

export function AltHero() {
  return (
    <main className="w-full overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden contain-strict lg:block"
      >
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>

      <section className="relative w-full space-y-2">
        <div className="relative z-10 py-24 md:pb-32 lg:pb-36 lg:pt-44">
          <div className="mx-auto flex w-full max-w-screen-2xl flex-col px-6 lg:block lg:px-12">
            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:max-w-2xl lg:text-left">
              <TooltipProvider>
                <a href="#early-access" className="inline-block mx-auto lg:mx-0" aria-hidden>
                  <Tooltip delayDuration={0}>
                    <TooltipContent
                      side="right"
                      className="text-sm scale-90"
                      sideOffset={5}
                    >
                      <p className="text-sm">
                        <span className="font-semibold">Click here</span> to join
                        the waitlist for the public launch.
                      </p>
                    </TooltipContent>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="ring-1 ring-white/30 dark:ring-neutral-300/60 no-underline group cursor-pointer relative shadow-2xl shadow-orange-600/50 rounded-full p-px text-xs font-semibold leading-6 text-white dark:text-white inline-block"
                      >
                        <span className="absolute inset-0 overflow-hidden rounded-full">
                          <span className="absolute inset-0 rounded-full shadow-lg bg-white/20 dark:bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(220,68,5,0.3)_0%,rgba(0,0,0,0.5)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </span>
                        <div className="relative flex space-x-2 items-center z-10 rounded-full py-0.5 px-4 ring-1 ring-white/20 dark:ring-white/10">
                          <span>NextJudge is in early access!</span>
                          <svg
                            fill="none"
                            height="16"
                            viewBox="0 0 24 24"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M10.75 8.75L14.25 12L10.75 15.25"
                              stroke="#dc4405"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </div>
                        <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-orange-600/0 via-orange-600/90 to-orange-600/0 transition-opacity duration-500 group-hover:opacity-40" />
                      </button>
                    </TooltipTrigger>
                  </Tooltip>
                </a>
              </TooltipProvider>

              <h1 className="mt-8 max-w-2xl text-balance text-3xl font-medium text-white dark:text-white sm:text-4xl md:text-5xl lg:mt-12 lg:text-6xl">
                Host and participate in online coding contests
                <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic">
                  {" "}with ease.
                </span>
              </h1>

              <p className="mt-6 max-w-xl md:max-w-3xl text-pretty text-base text-white/80 dark:text-muted-foreground sm:mt-8 sm:text-lg">
                What started as a way for{" "}
                <Link
                  href="https://acm.oregonstate.edu"
                  className="text-osu hover:underline"
                >
                  ACM@OSU
                </Link>{" "}
                to practice for ICPC, is now a fully-featured platform to host,
                judge, and compete in programming contests.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:mt-12 sm:flex-row lg:justify-start">
                <HeroButtons />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-4 inset-y-1 -z-10 overflow-hidden rounded-3xl border border-black/10 lg:rounded-[3rem] dark:border-white/10">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-50 invert dark:opacity-35 dark:invert-0 dark:lg:opacity-75"
            src="/demo/demo.mp4"
            title="NextJudge Demo"
          >
            <source src="/demo/demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/50 dark:bg-black/80" />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
          />
        </div>
      </section>

      <section className="pt-6 pb-0 select-none" aria-hidden>
        <div className="group relative m-auto max-w-6xl px-6">
          <div className="flex flex-col items-center md:flex-row">
            <div className="inline md:max-w-52 md:border-r md:pr-6">
              <p className="text-end text-sm">
                Solve problems in all of the languages we know and love
              </p>
            </div>
            <div className="relative py-6 md:w-[calc(100%-13rem)]">
              <Marquee className="[--duration:30s] [--gap:3rem]">
                {languageLogos.map((logo, index) => (
                  <div key={index} className="flex">
                    <Image
                      className={cn(
                        "mx-auto h-8 w-fit",
                        logo.size === "32" && "size-18",
                        logo.size === "24" && "size-12",
                        logo.style && logo.style,
                      )}
                      src={logo.icon}
                      alt={logo.alt}
                      width={parseInt(logo.size || "24")}
                      height={parseInt(logo.size || "24")}
                    />
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
