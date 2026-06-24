import type { MetadataRoute } from "next";

import {
  PUBLIC_SITEMAP_ROUTES,
  createAbsoluteUrl,
} from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: createAbsoluteUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
