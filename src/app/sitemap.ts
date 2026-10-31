import type { MetadataRoute } from "next";
import { SITE_URL, bakedContent } from "@/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  });
  return [
    page("/", 1),
    page("/products/", 0.9),
    ...bakedContent.products.map((p) => page(`/products/${p.slug}/`, 0.9)),
    page("/bulk/", 0.8),
    page("/story/", 0.6),
    page("/contact/", 0.6),
  ];
}
