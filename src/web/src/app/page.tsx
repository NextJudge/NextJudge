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
    <div className="min-h-screen w-full text-white relative" style={{
      backgroundImage: "url('/page-bg.jpg')",
      backgroundSize: "100% 100%",
      backgroundPosition: "bottom",
      backgroundRepeat: "no-repeat",
    }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/90 backdrop-blur-sm z-0" />
      <LandingNavbar session={session || undefined} />
      <main className="flex max-w-screen-2xl mx-auto gap-10 flex-col items-center justify-between overflow-x-hidden relative z-10">
        <AltHero />
        <LandingEditor />
        <Features />
        <EarlyAccess />
        <FAQ />
        <div
          className="relative overflow-hidden"
          style={{
            backgroundImage: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,0.95) 0%,
        rgba(0,0,0,0.6) 25%,
        rgba(0,0,0,0.25) 55%,
        rgba(0,0,0,0.05) 75%,
        rgba(0,0,0,0.0) 100%
      ),
      url('/4.png')
    `,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="relative z-10">
            <Footer />
          </div>
        </div>

        <ScrollToTop />
      </main>
    </div>
  );
}
