"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EarlyAccess() {
  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log("Subscribed!");
  };
  return (
    <section
      className="container py-24 sm:py-24 dark:bg-grid-white/[0.04] bg-grid-black/[0.05]"
      id="early-access"
    >
      <div className="relative container flex flex-col items-center justify-center py-32 space-x-64 w-full">
        <div className="py-20 relative">
          <div className="w-full mx-auto">
            <h3 className="text-center text-3xl font-medium">
              Get first access to NextJudge
            </h3>
            <p className="text-xl text-muted-foreground text-center mt-4 mb-8">
              Subscribe to our newsletter and get notified when we launch.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col w-full md:flex-row gap-4 md:gap-4 justify-center items-center mx-auto"
            >
              <Input
                placeholder="leomirandadev@gmail.com"
                className="bg-muted/50 dark:bg-muted/80 w-full md:w-8/12"
                aria-label="email"
              />
              <Button className="w-full md:w-1/6">Subscribe</Button>
            </form>
          </div>
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute -top-20 -left-60 -z-50 w-2/6 opacity-40 h-auto bg-transparent blur-[60px] backdrop-filter animate-[spin_12s_linear_infinite]"
          />
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute -top-20 left-72 -right-96 -z-50 w-2/6 opacity-40 h-auto bg-transparent blur-[60px] backdrop-filter animate-[spin_12s_linear_infinite]"
          />
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute top-24 -left-40 right-0 -z-50 w-2/6 opacity-40 h-auto bg-transparent blur-[60px] backdrop-filter animate-[spin_12s_linear_infinite]"
          />

          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute top-20 -right-40 -z-50 w-2/6 opacity-40 h-auto bg-transparent blur-[90px] backdrop-filter animate-[spin_10s_linear_infinite]"
          />
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute top-24 left-32 -right-96 -z-50 w-3/6 opacity-40 h-auto bg-transparent blur-[90px] backdrop-filter animate-[spin_10s_linear_infinite]"
          />
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute top-4 -right-96 -z-50 w-3/6 opacity-40 h-auto bg-transparent blur-[90px] backdrop-filter animate-[spin_10s_linear_infinite]"
          />
          <img
            src="/blobs/blob1.svg"
            alt="background"
            className="absolute top-4 -left-96 -z-50 w-3/6 opacity-40 h-auto bg-transparent blur-[90px] backdrop-filter animate-[spin_10s_linear_infinite]"
          />
        </div>
      </div>
    </section>
  );
}
