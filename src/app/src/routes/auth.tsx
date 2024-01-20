import LoginCard from "@/components/login";

import "@/styles/layout.css";

export default function Auth() {
  return (
    <main className="layout h-screen w-full bg-black bg-fixed text-white selection:bg-white selection:text-black">
      <section className="container px-4  md:px-3 md:pt-16 lg:pt-16 xl:pt-24">
        <div className="flex flex-col justify-center space-y-4 text-center">
          <h1 className="mx-auto text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl">
            Welcome
          </h1>
          <div className="mb-6 space-y-4">
            <p className="text-md mx-auto max-w-3xl text-zinc-200 sm:text-base md:text-xl">
              Begin your journey to become a better programmer.
            </p>
          </div>
        </div>

        <LoginCard />
      </section>

      <footer className="container mt-32 grid place-items-center pb-4 text-neutral-400">
        <span className="flex items-center gap-1">
          &copy;
          <span>{new Date().getFullYear()}</span>
          <a
            href="https://github.com/NextJudge"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 duration-200 hover:text-white hover:underline"
          >
            NextJudge Team
          </a>
        </span>
      </footer>
    </main>
  );
}
