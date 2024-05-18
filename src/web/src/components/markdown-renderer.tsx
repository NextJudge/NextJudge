"use client";

// import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import Markdown from "react-markdown";
// import rehypeKatex from "rehype-katex";
// import rehypeStringify from "rehype-stringify";
// import remarkMath from "remark-math";
// import remarkParse from "remark-parse";
// import remarkRehype from "remark-rehype";
// import rehypeRaw from "rehype-raw";

export default function MarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <>
      <Markdown

      // remarkPlugins={[remarkMath, remarkParse, remarkRehype]}
      // rehypePlugins={[rehypeKatex, rehypeStringify, rehypeRaw]}
      >
        {markdown}
      </Markdown>
    </>
  );
}
