import { auth } from "@/app/auth";
import { Footer } from "@/components/footer";
import { AltHero } from "@/components/landing/alt-hero";
import { LanguagesBanner } from "@/components/landing/banner";
import { EarlyAccess } from "@/components/landing/early-access";
import { FAQ } from "@/components/landing/faq";
import { ScrollToTop } from "@/components/landing/scroll-up";
import { Services } from "@/components/landing/services";
import { LandingNavbar } from "@/components/nav/landing-navbar";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
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
      <div className="fixed inset-0 pointer-events-none">
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="absolute top-0 left-0 w-1/3 mx-auto opacity-70 dark:opacity-30 h-auto bg-transparent blur-[200px] backdrop-filter"
        />
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="absolute top-0 right-0 w-3/6 opacity-50 dark:opacity-20 h-auto bg-transparent blur-[200px] backdrop-filter"
        />
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="absolute bottom-20 left-0 translate-y-2/4 w-full mx-auto opacity-70 dark:opacity-30 h-full scale-100 bg-transparent blur-[250px] backdrop-filter"
        />
      </div>
      <LandingNavbar session={session || undefined} />
      <main className="flex max-w-full gap-10 flex-col items-center justify-between overflow-x-hidden relative z-10">
        <AltHero />
        <WhyNextJudge />
        <Services />
        <LandingEditor />
        <LanguagesBanner />
        <EarlyAccess />
        <FAQ />
        <Footer />
        <ScrollToTop />
      </main>
    </>
  );
}
