import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-background bg-fixed bg-cover bg-bottom error-bg"
    >
      <div className="container px-4">
        <div className="mx-auto max-w-lg text-center text-gray-50">
          <div className="relative">
            <p
              className="relative text-9xl font-sans font-bold tracking-tighter-less text-shadow"
              aria-hidden="true"
            >
              <span>4</span>
              <span>0</span>
              <span>4</span>
            </p>
          </div>
          <h1 className="mt-3 font-semibold text-white">Page not found</h1>
          <p className="mt-2 mb-6 text-white">
            We&apos;re sorry, but the page you were looking for doesn&apos;t
            exist in our source code.
          </p>
          <nav
            aria-label="Recovery links"
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link className={buttonVariants({ variant: "default" })} href="/">
              Return to home
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "text-white border-white/40 hover:bg-white/10")}
              href="/platform"
            >
              Go to platform
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "link" }), "text-white")}
              href="/platform/problems"
            >
              Browse problems
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
