"use client";

import { EmailForm } from "@/components/forms/mailing-list-form";
import { Vortex } from "@/components/ui/vortex";

export function EarlyAccess() {
  return (
    <section
      id="early-access"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden space-y-20"
    >
      <Vortex
        rangeSpeed={0.5}
        baseSpeed={0.1}
        rangeY={800}
        particleCount={100}
        baseHue={120}
        className="flex items-center flex-col justify-center w-screen h-screen"
      >
        <EmailForm />
      </Vortex>
    </section>
  );
}
