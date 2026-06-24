import type { Metadata } from "next";

import {
  BRAND_NAME,
  LOCALE,
  PAGE_TITLES,
  SITE_COPY,
  SITE_URLS,
  TWITTER,
} from "@/lib/site";
import { getAppUrl } from "@/lib/utils";

export const SEO_ROBOTS = {
  index: {
    index: true,
    follow: true,
    "max-snippet": 120,
  },
  noIndex: {
    index: false,
    follow: false,
  },
} as const satisfies Record<string, Metadata["robots"]>;

export const PUBLIC_SITEMAP_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/auth/signup", changeFrequency: "monthly" as const, priority: 0.6 },
] as const;

export const ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/platform/",
  "/auth/logout",
  "/auth/login",
  "/error",
  "/bench",
  "/team",
] as const;

const openGraphImage = {
  url: "/opengraph-image.webp",
  width: 1496,
  height: 883,
  alt: SITE_COPY.openGraphImageAlt,
} as const;

export const getMetadataBase = (): URL => new URL(getAppUrl());

export const createAbsoluteUrl = (path: string): string => {
  const base = getAppUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export const createRootMetadata = (): Metadata => ({
  metadataBase: getMetadataBase(),
  title: {
    default: PAGE_TITLES.default,
    template: `%s | ${BRAND_NAME}`,
  },
  description: SITE_COPY.description,
  applicationName: BRAND_NAME,
  generator: "Next.js",
  robots: SEO_ROBOTS.index,
  openGraph: {
    type: "website",
    locale: LOCALE.openGraph,
    url: getAppUrl(),
    siteName: BRAND_NAME,
    title: PAGE_TITLES.default,
    description: SITE_COPY.description,
    images: [openGraphImage],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLES.default,
    description: SITE_COPY.description,
    creator: TWITTER.creator,
    images: [openGraphImage.url],
  },
});

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
};

export const createPageMetadata = ({
  title,
  description,
  path,
  robots = SEO_ROBOTS.index,
}: PageMetadataOptions): Metadata => ({
  title,
  description,
  robots,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    url: path,
  },
  twitter: {
    title,
    description,
  },
});

export const createWebsiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URLS.production.app}/#organization`,
      name: BRAND_NAME,
      url: SITE_URLS.production.app,
      logo: SITE_URLS.production.logo,
      sameAs: [SITE_URLS.production.github],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URLS.production.app}/#website`,
      url: SITE_URLS.production.app,
      name: BRAND_NAME,
      description: SITE_COPY.description,
      publisher: { "@id": `${SITE_URLS.production.app}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: BRAND_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: SITE_URLS.production.app,
      description: SITE_COPY.description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
});
