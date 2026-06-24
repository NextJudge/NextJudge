import { auth } from "@/app/auth";
import { JsonLd } from "@/components/seo/json-ld";
import { Footer } from "@/components/footer";
import { AltHero } from "@/components/landing/alt-hero";
import { EarlyAccess } from "@/components/landing/early-access";
import Features from "@/components/landing/features";
import { ScrollToTop } from "@/components/landing/scroll-up";
import { LandingNavbar } from "@/components/nav/landing-navbar";
import { NavbarWithSession } from "@/components/nav/navbar-with-session";
import { createPageMetadata, createWebsiteJsonLd } from "@/lib/seo";
import { PAGE_TITLES, SITE_COPY } from "@/lib/site";
import Dynamic from "next/dynamic";
import { Suspense } from "react";
import { preload } from "react-dom";

const LandingEditor = Dynamic(
  () => import("@/components/landing/landing-editor").then((mod) => mod.LandingEditor),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: PAGE_TITLES.home,
  description: SITE_COPY.descriptionShort,
  path: "/",
});

export default async function Home() {
  const session = await auth();

  preload("/hero-background.png", { as: "image" });
  preload("/footer-background.png", { as: "image" });
  preload("/early-access-background.png", { as: "image" });

  return (
    <div className="min-h-screen w-full text-white relative bg-black">
      <JsonLd data={createWebsiteJsonLd()} />
      <Suspense fallback={<LandingNavbar session={undefined} />}>
        <NavbarWithSession />
      </Suspense>
      <main className="flex max-w-screen-2xl mx-auto gap-4 flex-col items-center justify-between overflow-x-hidden relative z-10">
        <div
          className="relative overflow-hidden w-full"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,1.0) 40%,
                rgba(0,0,0,0.7) 55%,
                rgba(0,0,0,0.55) 25%,
                rgba(0,0,0,1.0) 100%
              ),
              url('/footer-background.png')
            `,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative z-10">
            <AltHero session={session} />
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
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
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
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
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
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="relative z-10 max-w-screen-2xl mx-auto">
            <EarlyAccess session={session} />
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
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
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
