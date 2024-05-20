"use client";

import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";

export default function MarkdownRenderer({
  markdown,
  prompt,
}: {
  markdown: string;
  prompt?: string;
}) {
  return (
    <>
      <Markdown
        remarkPlugins={[remarkMath, remarkParse, remarkRehype]}
        rehypePlugins={[rehypeKatex, rehypeStringify, rehypeRaw]}
      >
        {prompt ? prompt : markdown}
      </Markdown>
    </>
  );
}
