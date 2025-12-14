import { auth } from "@/app/auth";
import { Footer } from "@/components/footer";
import { AltHero } from "@/components/landing/alt-hero";
import { EarlyAccess } from "@/components/landing/early-access";
import { FAQ } from "@/components/landing/faq";
import Features from "@/components/landing/features";
import { ScrollToTop } from "@/components/landing/scroll-up";
import { LandingNavbar } from "@/components/nav/landing-navbar";
import { Metadata } from "next";
import dynamic from "next/dynamic";
const WhyNextJudge = dynamic(
  () => import("@/components/landing/bento").then((mod) => mod.WhyNextJudge),
  { ssr: false }
);
const LandingEditor = dynamic(
  () => import("@/components/landing/landing-editor").then((mod) => mod.LandingEditor),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "NextJudge - Run competitive programming contests with ease.",
  description:
    "NextJudge is a competitive programming platform built for the modern era. NextJudge is designed to be easy to use, fast, and extensible.",
};

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen w-full text-white relative bg-black">
      <LandingNavbar session={session || undefined} />
      <main className="flex max-w-screen-2xl mx-auto gap-10 flex-col items-center justify-between overflow-x-hidden relative z-10">
        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 0%,
                rgba(0,0,0,0.8) 15%,
                rgba(0,0,0,0.4) 30%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.4) 70%,
                rgba(0,0,0,0.8) 85%,
                rgba(0,0,0,1.0) 100%
              ),
              url('/footer-background.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10">
            <AltHero />
          </div>
        </div>

        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 0%,
                rgba(0,0,0,0.5) 15%,
                rgba(0,0,0,0.4) 30%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.4) 70%,
                rgba(0,0,0,0.8) 85%,
                rgba(0,0,0,1.0) 100%
              ),
              url('/hero-background.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10 max-w-screen-2xl mx-auto">
            <LandingEditor />
          </div>
        </div>

        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 0%,
                rgba(0,0,0,0.8) 15%,
                rgba(0,0,0,0.4) 30%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.4) 70%,
                rgba(0,0,0,0.6) 85%,
                rgba(0,0,0,1.0) 100%
              ),
              url('/footer-background.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10 max-w-screen-2xl mx-auto">
            <Features />
          </div>
        </div>

        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 0%,
                rgba(0,0,0,0.8) 15%,
                rgba(0,0,0,0.4) 30%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.4) 70%,
                rgba(0,0,0,0.8) 85%,
                rgba(0,0,0,1.0) 100%
              ),
              url('/early-access-background.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10 max-w-screen-2xl mx-auto">
            <EarlyAccess />
          </div>
        </div>

        <div className="relative overflow-hidden w-full">
          <div className="max-w-screen-2xl mx-auto">
            <FAQ />
          </div>
        </div>

        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 0%,
                rgba(0,0,0,0.8) 15%,
                rgba(0,0,0,0.4) 30%,
                rgba(0,0,0,0.0) 50%,
                rgba(0,0,0,0.0) 50%
              ),
              url('/footer-background.png')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10 max-w-screen-2xl mx-auto">
            <Footer />
          </div>
        </div>

        <ScrollToTop />
      </main>
    </div>
  );
}
