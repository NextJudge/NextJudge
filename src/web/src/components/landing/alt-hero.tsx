'use client'

import { cn } from "@/lib/utils";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import HeroButtons from "./hero-buttons";
import Link from "next/link";

const languageLogos = [
  { icon: pythonSvg, alt: "Python programming language logo", height: 12 },
  { icon: javascriptSvg, alt: "JavaScript programming language logo", height: 12 },
  { icon: cplusplusSvg, alt: "C++ programming language logo", height: 12 },
  { icon: golangSvg, alt: "Go programming language logo", height: 12, scale: true },
  { icon: haskellSvg, alt: "Haskell programming language logo", height: 12, scale: true },
  { icon: kotlinSvg, alt: "Kotlin programming language logo", height: 12 },
  { icon: csharpSvg, alt: "C# programming language logo", height: 12 },
  { icon: javaSvg, alt: "Java programming language logo", height: 12 },
  { icon: typeScriptSvg, alt: "TypeScript programming language logo", height: 12 },
  { icon: phpSvg, alt: "PHP programming language logo", height: 12, scale: true },
  { icon: swiftSvg, alt: "Swift programming language logo", height: 12 },
  { icon: rustSvg, alt: "Rust programming language logo", height: 12 },
  { icon: cSvg, alt: "C programming language logo", height: 12 },
  { icon: luaSvg, alt: "Lua programming language logo", height: 12 },
  { icon: rubySvg, alt: "Ruby programming language logo", height: 12 },
];

export function AltHero() {
  return (
    <>
      <main>
        <div
          aria-hidden
          className="z-2 absolute inset-0 isolate hidden opacity-50 contain-strict lg:block">
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>

        <section className="bg-muted/50 dark:bg-background overflow-hidden relative">
          <div className="relative mx-auto max-w-5xl px-6 pt-10">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <TooltipProvider>
                <div className="text-center space-y-6">
                  <div className="mx-auto flex items-center justify-center">
                    <a href="#early-access">
                      <Tooltip delayDuration={0}>
                        <TooltipContent
                          side="right"
                          className={cn("text-sm", "scale-90")}
                          sideOffset={5}
                        >
                          <p className="text-sm">
                            <span className="font-semibold">Click here</span> to join
                            the waitlist for the public launch.
                            <br />
                          </p>
                        </TooltipContent>
                        <TooltipTrigger asChild>
                          <button className="scale-90 ring-1 ring-neutral-300/60 no-underline group cursor-pointer relative shadow-2xl shadow-orange-600/50 rounded-full p-px text-xs font-semibold leading-6  dark:text-white inline-block">
                            <span className="absolute inset-0 overflow-hidden rounded-full">
                              <span className="absolute inset-0 rounded-full shadow-lg bg-neutral-200 dark:bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(220,68,5,0.3)_0%,rgba(0,0,0,0.5)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </span>
                            <div className="relative flex space-x-2 items-center z-10 rounded-full py-0.5 px-4 ring-1 dark:ring-white/10 ring-orange-500/60 ">
                              <span>NextJudge is in early access!</span>
                              <svg
                                fill="none"
                                height="16"
                                viewBox="0 0 24 24"
                                width="16"
                                xmlns="http://www.w3.org/2000/svg"
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
                  </div>
                  <h1 className="text-3xl font-semibold md:text-4xl lg:text-4xl leading-snug">
                    Host and participate in online coding contests
                    <span className="bg-gradient-to-r from-osu to-osu text-transparent bg-clip-text font-serif italic">
                      {" "}
                      with ease.
                    </span>
                  </h1>

                  <p className="text-muted-foreground mx-auto my-8 max-w-2xl text-base">
                    What started as a way for <Link href="https://acm.oregonstate.edu" className="text-osu hover:underline">ACM@OSU</Link> to practice for ICPC, is now a fully-featured platform to host, judge, and compete in programming contests.
                  </p>
                  <HeroButtons />
                </div>
              </TooltipProvider>
            </div>
          </div>

          <div className="mx-auto 2xl:max-w-7xl">
            <div className="[perspective:2000px] pl-8 lg:pl-44">
              <div
                className="lg:h-[44rem] [transform:rotateX(20deg)_skewX(12deg)] pl-6 pt-6"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%), linear-gradient(to right, black 75%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%), linear-gradient(to right, black 75%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'source-in',
                }}
              >
                <video
                  loop
                  controls={false}
                  className="rounded-lg border shadow-xl object-cover w-full h-full max-w-7xl"
                  preload="auto"
                  muted
                  src="/demo/demo.mp4"
                  title="NextJudge Demo"
                  playsInline
                  autoPlay
                  width="100%"
                  height="100%"
                >
                  <source src="/demo/demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        <section className="dark:bg-background bg-muted/50 relative z-10 py-16">
          <div className="m-auto max-w-5xl px-6">
            <h2 className="text-center text-lg font-medium">Solve problems in all of the programming languages that we know and love.</h2>
            <div className="mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12">
              {languageLogos.map((logo, index) => (
                <img
                  key={index}
                  className={cn("w-fit", `size-${logo.height}`, {
                    "scale-125": logo.scale,
                  })}
                  src={logo.icon.src}
                  alt={logo.alt}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
