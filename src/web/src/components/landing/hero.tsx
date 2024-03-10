import { Button, buttonVariants } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";
export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-osu  to-osubrown text-transparent bg-clip-text">
              Next Generation
            </span>{" "}
            Platform
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
          NextJudge is a modern, open-source platform for hosting and partaking
          in competitive programming. It is designed to be easy to use, fast,
          and extensible.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3">
            <a href="/platform">Get Started</a>
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
      <div className="z-10 lg:scale-125">
        <Image
          src="/preview.png"
          alt="Editor Preview"
          width={1000}
          height={1000}
          className="rounded-lg ring-1 ring-osu/20 bg-black w-fit h-fit lg:w-full lg:h-full"
        />
      </div>
      <div className="shadow-anim"></div>
    </section>
  );
};
