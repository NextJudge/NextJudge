import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { Button, buttonVariants } from "../ui/button";
export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-osu  to-osubrown text-transparent bg-clip-text">
              Ergonomic
            </span>{" "}
            Code Judge
          </h1>{" "}
          for{" "}
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-osubrown to-osu text-transparent bg-clip-text">
              Competitive
            </span>{" "}
            Programming
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          NextJudge is a modern, ergonomic and feature-rich code judge for
          competitive programming. It is designed to be blazing fast, reliable
          and user-friendly.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3">
            <a href="/auth/signup">Get Started</a>
          </Button>
          <a
            href="https://github.com/nextjudge/nextjudge"
            target="_blank"
            className={`w-full md:w-1/3 ${buttonVariants({
              variant: "outline",
            })}`}
          >
            Github Repository
            <GitHubLogoIcon className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Hero preview */}
      <div className="z-10">
        <Image
          src="/preview.png"
          alt="Editor Preview"
          width={1000}
          height={1000}
          className="w-[48rem] dark:shadow-osu max-w-none rounded-lg ring-2 ring-orange-500 dark:ring-orange-600/20 ring-opacity-10 border-8 border-white border-opacity-5 sm:w-[50rem] md:-ml-4 lg:-ml-0"
        />
      </div>
    </section>
  );
};
