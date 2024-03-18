import { Footer } from "@/components/footer";
import { AltHero } from "@/components/landing/alt-hero";
import { LanguagesBanner } from "@/components/landing/banner";
import { WhyNextJudge } from "@/components/landing/bento";
import EarlyAccess from "@/components/landing/early-access";
import { FAQ } from "@/components/landing/faq";
import { ScrollToTop } from "@/components/landing/scroll-up";
import { Services } from "@/components/landing/services";
import { Navbar } from "@/components/navbar";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "NextJudge - Elevate your coding skills to the next level.",
  description:
    "An all-new, competitive programming platform built for organizers, developers, and participants.",
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex max-w-screen gap-10 flex-col items-center justify-between overflow-x-hidden">
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="dark:hidden absolute top-0 left-0 -z-50 w-1/3 mx-auto opacity-70 h-auto bg-transparent blur-[200px] backdrop-filter"
        />
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="dark:hidden absolute top-0 right-0 -z-50 w-3/6 opacity-50 h-auto bg-transparent blur-[200px] backdrop-filter"
        />
        <AltHero />
        <Image
          src="/blobs/blob1.svg"
          alt="background"
          priority={true}
          width={100}
          height={50}
          className="hidden dark:block absolute bottom-20 left-0 translate-y-2/4 -z-50 w-full mx-auto opacity-70 h-full bg-transparent blur-[250px] backdrop-filter"
        />
        <Services />
        <LanguagesBanner />
        <WhyNextJudge />
        <EarlyAccess />
        <FAQ />
        <Footer />
        <ScrollToTop />
      </main>
    </>
  );
}
