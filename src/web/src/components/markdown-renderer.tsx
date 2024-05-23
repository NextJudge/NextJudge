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
  const source = prompt?.replace(/\n/gi, "\n &nbsp;");
  return (
    <>
      <MathJaxContext version={3} config={config}>
        <MathJax dynamic hideUntilTypeset="every">
          <Markdown
            className="prose dark:prose-invert prose-orange whitespace-pre-wrap"
            remarkPlugins={[remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex, rehypeRaw, rehypeStringify]}
          >
            {source}
          </Markdown>
        </MathJax>
      </MathJaxContext>
    </>
  );
}
