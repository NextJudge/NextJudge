"use client";

import type { BundledTheme } from "shiki";
import { Streamdown } from "streamdown";

const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

interface LandingProblemStatementProps {
  prompt: string;
}

export const LandingProblemStatement = ({ prompt }: LandingProblemStatementProps) => {
  return (
    <div className="[&_pre]:!bg-black/60 [&_pre]:!border-osu/50 [&_pre]:!border [&_pre]:!rounded-md [&_pre]:!p-3 [&_pre]:!my-2 [&_pre]:!text-xs [&_pre]:!font-mono [&_pre]:!text-white [&_pre]:!overflow-x-auto [&_pre_code]:!bg-transparent [&_pre_code]:!p-0 [&_pre_code]:!text-white [&_code]:!bg-black/60 [&_code]:!px-1 [&_code]:!py-0.5 [&_code]:!rounded [&_code]:!text-xs [&_code]:!font-mono [&_code]:!text-white">
      <Streamdown
        shikiTheme={themes}
        className="prose dark:prose-invert prose-sm max-w-none
                   prose-headings:font-semibold prose-headings:text-white prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm
                   prose-h2:border-b prose-h2:border-osu/40 prose-h2:pb-1
                   prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-sm
                   prose-strong:text-white prose-strong:font-medium
                   prose-code:bg-black/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-white
                   prose-pre:bg-black/60 prose-pre:border prose-pre:border-osu/50 prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-pre:text-xs prose-pre:overflow-x-auto
                   prose-ul:space-y-0.5 prose-ol:space-y-0.5 prose-ul:my-1.5 prose-ol:my-1.5
                   prose-li:text-gray-300 prose-li:text-sm
                   [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white"
      >
        {prompt}
      </Streamdown>
    </div>
  );
};
