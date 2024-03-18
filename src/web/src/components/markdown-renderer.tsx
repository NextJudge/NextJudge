"use client";

import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <>
      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {markdown.toString()}
      </Markdown>
    </>
  );
}
