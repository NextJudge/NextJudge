"use client";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface LandingProblemStatementProps {
  prompt: string;
}

export const LandingProblemStatement = ({ prompt }: LandingProblemStatementProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkBreaks]}
      className="prose dark:prose-invert prose-sm max-w-none pb-10
                 prose-headings:font-semibold prose-headings:text-white prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm
                 prose-h2:border-b prose-h2:border-osu/40 prose-h2:pb-1
                 prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-sm
                 prose-strong:text-white prose-strong:font-medium
                 prose-code:bg-transparent prose-code:px-0 prose-code:text-sm prose-code:font-mono prose-code:text-white
                 prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0 prose-pre:my-2 prose-pre:text-sm prose-pre:overflow-x-auto
                 prose-ul:space-y-0.5 prose-ol:space-y-0.5 prose-ul:my-1.5 prose-ol:my-1.5
                 prose-li:text-gray-300 prose-li:text-sm
                 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white"
    >
      {prompt}
    </Markdown>
  );
};
