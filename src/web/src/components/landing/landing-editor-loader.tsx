"use client";

import dynamic from "next/dynamic";

const LandingEditor = dynamic(
  () =>
    import("@/components/landing/landing-editor").then(
      (module) => module.LandingEditor,
    ),
  { ssr: false },
);

export function LandingEditorLoader() {
  return <LandingEditor />;
}
