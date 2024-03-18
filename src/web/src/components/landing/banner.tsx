"use client";

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
import { cn } from "../../lib/utils";
import { InfiniteMovingCards } from "../ui/infinite-moving-cards";

export function LanguagesBanner() {
  return (
    <>
      <section className="container grid lg:grid-cols-1 place-items-center my-12 py-12 md:my-28 md:py-32 dark:bg-grid-white/[0.04] bg-grid-black/[0.05] h-full">
        <h1 className="text-xl md:text-4xl font-medium font-sans text-center max-w-3xl">
          Solve problems in all of the programming languages that{" "}
          <span
            className=" font-serif italic font-semibold"
            style={{
              background: "linear-gradient(transparent 50%, #FF6600 50%)",
            }}
          >
            we know and love.
          </span>
        </h1>
        <div className="h-min antialiased flex flex-col my-12 gap-6 md:gap-12 -space-y-12 items-center justify-center relative overflow-hidden">
          <InfiniteMovingCards
            items={secondRowItems}
            direction="left"
            speed="slow"
            pauseOnHover={false}
          />
          <InfiniteMovingCards
            items={firstRowItems}
            direction="right"
            speed="slow"
            pauseOnHover={false}
          />
        </div>
      </section>
    </>
  );
}

interface SvgProps {
  icon: any;
  size: string;
}

type Component = (props: SvgProps) => JSX.Element;

const SvgAsJsx: Component = ({ icon, size }) => {
  return (
    <img
      src={icon.src}
      alt={icon.alt}
      width={size}
      height={size}
      className={cn("select-none pointer-events-none rounded-md", {
        "w-10 h-10": size === "10",
        "w-9 h-9": size === "9",
        "w-12 h-12": size === "12",
        "w-14 h-14": size === "14",
        "w-16 h-16": size === "16",
        "w-20 h-20": size === "20",
        "w-24 h-24": size === "24",
      })}
    />
  );
};

const firstRowItems = [
  { label: "Python", icon: SvgAsJsx({ icon: pythonSvg, size: "24" }) },
  { label: "JavaScript", icon: SvgAsJsx({ icon: javascriptSvg, size: "12" }) },
  { label: "C++", icon: SvgAsJsx({ icon: cplusplusSvg, size: "24" }) },
  { label: "Go", icon: SvgAsJsx({ icon: golangSvg, size: "24" }) },
  { label: "Haskell", icon: SvgAsJsx({ icon: haskellSvg, size: "16" }) },
  { label: "Kotlin", icon: SvgAsJsx({ icon: kotlinSvg, size: "14" }) },
  { label: "C#", icon: SvgAsJsx({ icon: csharpSvg, size: "12" }) },
];

const secondRowItems = [
  { label: "Java", icon: SvgAsJsx({ icon: javaSvg, size: "16" }) },
  { label: "TypeScript", icon: SvgAsJsx({ icon: typeScriptSvg, size: "12" }) },
  { label: "PHP", icon: SvgAsJsx({ icon: phpSvg, size: "20" }) },
  { label: "Swift", icon: SvgAsJsx({ icon: swiftSvg, size: "14" }) },
  { label: "Rust", icon: SvgAsJsx({ icon: rustSvg, size: "14" }) },
  { label: "C", icon: SvgAsJsx({ icon: cSvg, size: "14" }) },
  { label: "Lua", icon: SvgAsJsx({ icon: luaSvg, size: "16" }) },
  { label: "Ruby", icon: SvgAsJsx({ icon: rubySvg, size: "10" }) },
];
const thirdRowItems = [];
