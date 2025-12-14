"use client";

import { EmailForm } from "@/components/forms/mailing-list-form";
import { Vortex } from "@/components/ui/vortex";

export function EarlyAccess() {
  return (
    <section
      id="early-access"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden space-y-20 px-4"
    >
      <div aria-hidden className="absolute inset-0 z-0" />
      <Vortex
        rangeSpeed={0.5}
        baseSpeed={0.05}
        rangeY={500}
        particleCount={500}
        baseHue={0}
        className="flex items-center flex-col justify-center w-full h-screen relative z-10"
      >
        <EmailForm />
      </Vortex>
    </section>
  );
}
