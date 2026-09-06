"use client";

import dynamic from "next/dynamic";

const Code = dynamic(() => import("@/components/code"), { ssr: false });

export function CodeLoader() {
  return <Code />;
}
