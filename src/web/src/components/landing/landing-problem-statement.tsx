"use client";

import type { BundledTheme } from "shiki";
import { Streamdown } from "streamdown";

const themes: [BundledTheme, BundledTheme] = ["github-light", "github-dark"];

interface LandingProblemStatementProps {
  prompt: string;
}

export const LandingProblemStatement = ({ prompt }: LandingProblemStatementProps) => {
  return (
    <Streamdown
      shikiTheme={themes}
      className="prose dark:prose-invert prose-sm max-w-none
                 prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm
                 prose-h2:border-b prose-h2:border-border prose-h2:pb-1
                 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-sm
                 prose-strong:text-foreground prose-strong:font-medium
                 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-foreground
                 prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-3 prose-pre:my-2 prose-pre:text-xs
                 prose-ul:space-y-0.5 prose-ol:space-y-0.5 prose-ul:my-1.5 prose-ol:my-1.5
                 prose-li:text-muted-foreground prose-li:text-sm"
    >
      {prompt}
    </Streamdown>
  );
};
