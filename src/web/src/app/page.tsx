import { auth } from "@/app/auth";
import { Footer } from "@/components/footer";
import { AltHero } from "@/components/landing/alt-hero";
import { EarlyAccess } from "@/components/landing/early-access";
import { FAQ } from "@/components/landing/faq";
import Features from "@/components/landing/features";
import { ScrollToTop } from "@/components/landing/scroll-up";
import { Services } from "@/components/landing/services";
import StatsSection from "@/components/landing/stats-section";
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
    <>
      <LandingNavbar session={session || undefined} />
      <main className="flex max-w-full gap-10 flex-col items-center justify-between overflow-x-hidden relative z-10">
        <AltHero />
        <LandingEditor />
        <Features />
        <EarlyAccess />
        <FAQ />
        <Footer />
        <ScrollToTop />
      </main>
    </>
  );
}
