"use client";

import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import * as React from "react";

export function BProgressProvider({
  color = "var(--primary)",
  height = "calc(var(--spacing) * 0.75)",
  options = { showSpinner: false },
  shallowRouting = true,
  ...props
}: React.ComponentProps<typeof ProgressProvider>) {
  return (
    <ProgressProvider
      data-slot="bprogress-provider"
      color={color}
      height={height}
      options={options}
      shallowRouting={shallowRouting}
      {...props}
    />
  );
}
