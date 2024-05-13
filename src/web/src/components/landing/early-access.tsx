"use client";
import { sendEmail } from "@/app/actions";
import { Vortex } from "../ui/vortex";
import { EmailForm } from "./email-form";

export function EarlyAccess() {
  return (
    <section
      id="early-access"
      className="w-full mx-auto rounded-md  h-screen overflow-hidden"
    >
      <Vortex
        rangeSpeed={0.5}
        baseSpeed={0.1}
        rangeY={800}
        particleCount={100}
        baseHue={120}
        className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
      >
        <EmailForm sendEmail={sendEmail} />
      </Vortex>
    </section>
  );
}
