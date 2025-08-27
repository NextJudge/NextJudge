"use client";

import { MathJax, MathJaxContext } from "better-react-mathjax";
import "katex/dist/katex.min.css";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";

const config = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
  },
};

export default function MarkdownRenderer({ prompt }: { prompt: string }) {
  return (
    <>
      <MathJaxContext version={3} config={config}>
        <MathJax dynamic hideUntilTypeset="every">
          <Markdown
            className="prose dark:prose-invert prose-orange max-w-none break-words prose-sm sm:prose-base
                       prose-headings:font-semibold prose-headings:text-foreground
                       prose-p:text-muted-foreground prose-p:leading-relaxed
                       prose-strong:text-foreground prose-strong:font-semibold
                       prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                       prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg prose-pre:p-4
                       prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:px-4 prose-blockquote:py-2
                       prose-ul:space-y-1 prose-ol:space-y-1
                       prose-li:text-muted-foreground"
            remarkPlugins={[remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex, rehypeRaw, rehypeStringify]}
          >
            {prompt}
          </Markdown>
        </MathJax>
      </MathJaxContext>
    </>
  );
}
