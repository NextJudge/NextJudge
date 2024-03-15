"use client";
import renderMathInElement from "katex/dist/contrib/auto-render.min.js";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";

export default function KatexSpan({ text, ...delegated }: any) {
  const katexTextRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (katexTextRef.current) {
      renderMathInElement(katexTextRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
          {
            left: "\\begin{equation}",
            right: "\\end{equation}",
            display: true,
          },
          { left: "\\begin{align}", right: "\\end{align}", display: true },
          { left: "\\begin{align*}", right: "\\end{align*}", display: true },
          {
            left: "\\begin{eqnarray}",
            right: "\\end{eqnarray}",
            display: true,
          },
          {
            left: "\\begin{eqnarray*}",
            right: "\\end{eqnarray*}",
            display: true,
          },
          { left: "\\begin{math}", right: "\\end{math}", display: false },
          { left: "\\textbf{", right: "}", display: false },
          { left: "\\textit{", right: "}", display: false },
          { left: "\\texttt{", right: "}", display: false },
          { left: "\\text{", right: "}", display: false },
        ],
      });
    }
  }, [text]);

  return (
    <div
      className="flex flex-wrap max-w-5xl items-center justify-start"
      ref={katexTextRef}
      {...delegated}
    >
      {text}
    </div>
  );
}
