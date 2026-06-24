import type { MetadataRoute } from "next";

import {
  ROBOTS_DISALLOW_PATHS,
  createAbsoluteUrl,
} from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: createAbsoluteUrl("/sitemap.xml"),
  };
}
