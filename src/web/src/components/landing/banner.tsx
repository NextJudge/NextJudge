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
import Marquee from "../ui/marquee";

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
        "w-44 h-44": size === "44",
      })}
    />
  );
};

const LanguageCard = ({
  label,
  icon,
}: {
  label: string;
  icon: JSX.Element;
}) => {
  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <div
          className={cn(
            `w-12 h-12 relative flex items-center justify-center rounded-md`
          )}
        >
          {icon}
        </div>
        <span className="text-lg font-medium">{label}</span>
      </div>
    </div>
  );
};

const items = [
  { label: "Python", icon: SvgAsJsx({ icon: pythonSvg, size: "44" }) },
  { label: "JavaScript", icon: SvgAsJsx({ icon: javascriptSvg, size: "24" }) },
  { label: "C++", icon: SvgAsJsx({ icon: cplusplusSvg, size: "44" }) },
  { label: "Go", icon: SvgAsJsx({ icon: golangSvg, size: "44" }) },
  { label: "Haskell", icon: SvgAsJsx({ icon: haskellSvg, size: "24" }) },
  { label: "Kotlin", icon: SvgAsJsx({ icon: kotlinSvg, size: "24" }) },
  { label: "C#", icon: SvgAsJsx({ icon: csharpSvg, size: "24" }) },
  { label: "Java", icon: SvgAsJsx({ icon: javaSvg, size: "24" }) },
  { label: "TypeScript", icon: SvgAsJsx({ icon: typeScriptSvg, size: "24" }) },
  { label: "PHP", icon: SvgAsJsx({ icon: phpSvg, size: "24" }) },
  { label: "Swift", icon: SvgAsJsx({ icon: swiftSvg, size: "24" }) },
  { label: "Rust", icon: SvgAsJsx({ icon: rustSvg, size: "24" }) },
  { label: "C", icon: SvgAsJsx({ icon: cSvg, size: "24" }) },
  { label: "Lua", icon: SvgAsJsx({ icon: luaSvg, size: "24" }) },
  { label: "Ruby", icon: SvgAsJsx({ icon: rubySvg, size: "24" }) },
];

const firstRow = items.slice(0, items.length / 2);
const secondRow = items.slice(items.length / 2, items.length);

export function LanguagesBanner() {
  return (
    <>
      <div className="relative flex h-full max-w-full flex-col items-center justify-center overflow-hidden space-y-20 py-32">
        <h1 className="xs:text-xl text-2xl mx-8 md:text-4xl font-medium font-sans text-center whitespace-normal w-96 md:w-7/12 md:max-w-3xl">
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
        <Marquee pauseOnHover className="[--duration:20s]">
          {firstRow.map((lang) => (
            <LanguageCard key={lang.label} {...lang} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:20s]">
          {secondRow.map((lang) => (
            <LanguageCard key={lang.label} {...lang} />
          ))}
        </Marquee>
      </div>
    </>
  );
}
