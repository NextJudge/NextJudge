import {
  BRAND_NAME,
  COPYRIGHT,
  EMAIL,
  SITE_URLS,
  getMailto,
} from "@/lib/site";
import { Pyramid } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";

type FooterProps = {
  variant?: "marketing" | "platform";
};

const platformLinkClassName =
  "opacity-60 hover:opacity-100 transition-opacity";

export const Footer = ({ variant = "marketing" }: FooterProps) => {
  if (variant === "platform") {
    return (
      <footer id="footer">
        <Separator className="w-11/12 mx-auto bg-neutral-900/50" />
        <section className="container py-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          <a
            href={SITE_URLS.production.docs}
            className={platformLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            Docs
          </a>
          <span className="opacity-40" aria-hidden="true">
            |
          </span>
          <a
            href={SITE_URLS.production.github}
            className={platformLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <span className="opacity-40" aria-hidden="true">
            |
          </span>
          <span className="opacity-60">
            &copy; {COPYRIGHT.year} {BRAND_NAME}
          </span>
        </section>
      </footer>
    );
  }

  return (
    <footer id="footer">
      <Separator className="w-11/12 mx-auto bg-neutral-900/50" />
      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-2 flex justify-center">
          <Link href="/" className="font-bold text-xl flex items-center">
            <Pyramid size={24} className="text-orange-600" />
            <span className="ml-2">{BRAND_NAME}</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">Docs</h3>
          <div>
            <a
              href={SITE_URLS.production.docsGettingStarted}
              className="opacity-60 hover:opacity-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started
            </a>
          </div>

          <div>
            <a
              href={SITE_URLS.production.docsApiReference}
              className="opacity-60 hover:opacity-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              API Reference
            </a>
          </div>

          <div>
            <a
              href={SITE_URLS.production.github}
              rel="noopener noreferrer"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <h3 className="font-bold text-lg">{BRAND_NAME}</h3>
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
            <Link href="/platform" className="opacity-60 hover:opacity-100">
              Home
            </Link>
          </div>

          <div>
            <Link
              href="/platform/problems"
              className="opacity-60 hover:opacity-100"
            >
              Problem Set
            </Link>
          </div>

          <div>
            <Link
              href="/platform/contests"
              className="opacity-60 hover:opacity-100"
            >
              Contests
            </Link>
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
              href={getMailto(EMAIL.hello)}
              className="opacity-60 hover:opacity-100"
            >
              Contact
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; {COPYRIGHT.year}{" "}
          <a
            target="_blank"
            href={SITE_URLS.production.app}
            className="text-orange-600 transition-all border-primary hover:border-b-2"
          >
            {BRAND_NAME}
          </a>
        </h3>
      </section>
    </footer>
  );
};
