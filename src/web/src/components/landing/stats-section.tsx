export default function StatsSection() {
  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-12">
        <div className="relative z-10 max-w-xl space-y-6">
          <h2 className="text-3xl font-medium lg:text-4xl">
            NextJudge brings out the best in everyone who competes.
          </h2>
          <p>
            NextJudge is evolving to be more than just a judge.{" "}
            <span className="font-medium">It supports an entire ecosystem</span> — of enthusiasts at our ACM chapter.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div>
            <p>
              We've only just scratched the surface of what's to come for NextJudge. Binary search walked so we could run.
            </p>
            <div className="mb-12 mt-12 grid grid-cols-2 gap-2 md:mb-0">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-zinc-950 to-zinc-600 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-zinc-800">
                  +5200
                </div>
                <p>Submissions Accepted</p>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-zinc-950 to-zinc-600 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-zinc-800">
                  ~12ms
                </div>
                <p>Average Runtime</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <blockquote className="border-l-4 pl-4">
              <p>
                Using NextJudge has transformed how we prepare for ICPC competitions. The platform&apos;s seamless integration of problem management, real-time judging, and multi-language support makes it the perfect tool for competitive programming teams.
              </p>

              <div className="mt-6 space-y-3">
                <cite className="block font-medium">ACM@OSU Team</cite>
                <img
                  className="h-5 w-fit dark:invert"
                  src="https://html.tailus.io/blocks/customers/nvidia.svg"
                  alt="OSU Logo"
                  height="20"
                  width="auto"
                />
              </div>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
