"use client";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";

export default function KatexSpan({ text, ...delegated }) {
  const katexTextRef = useRef();
  useEffect(() => {
    if (katexTextRef.current) {
      renderMathInElement(katexTextRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
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
