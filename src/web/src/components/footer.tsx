import { Pyramid } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";

export const Footer = () => {
  return (
    <footer id="footer">
      <Separator className="w-11/12 mx-auto bg-neutral-900/50" />
      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-2 flex justify-center">
          <Link href="/" className="font-bold text-xl flex items-center">
            <Pyramid size={24} className="text-orange-600" />
            <span className="ml-2">NextJudge</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">Docs</h3>
          <div>
            <a
              href="https://docs.nextjudge.net/start/getting-started/"
              className="opacity-60 hover:opacity-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started
            </a>
          </div>

          <div>
            <a
              href="https://docs.nextjudge.net/reference/api/"
              className="opacity-60 hover:opacity-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              API Reference
            </a>
          </div>

          <div>
            <a
              href="https://github.com/nextjudge"
              rel="noopener noreferrer"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">NextJudge</h3>
          <div>
            <Link href="/#try-it" className="opacity-60 hover:opacity-100">
              Services
            </Link>
          </div>

          <div>
            <Link href="/#features" className="opacity-60 hover:opacity-100">
              Features
            </Link>
          </div>

          <div>
            <Link href="/#early-access" className="opacity-60 hover:opacity-100">
              Early Access
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">Platform</h3>
          <div>
            <span className="opacity-40 cursor-not-allowed">Home</span>
          </div>

          <div>
            <span className="opacity-40 cursor-not-allowed">Problem Set</span>
          </div>

          <div>
            <span className="opacity-40 cursor-not-allowed">Contests</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">Community</h3>

          <div>
            <Link href="/team" className="opacity-60 hover:opacity-100">
              Our Team
            </Link>
          </div>

          <div>
            <a
              href="mailto:hello@nextjudge.net"
              className="opacity-60 hover:opacity-100"
            >
              Contact
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2025{" "}
          <a
            target="_blank"
            href="https://nextjudge.net"
            className="text-orange-600 transition-all border-primary hover:border-b-2"
          >
            NextJudge
          </a>
        </h3>
      </section>
    </footer>
  );
};
