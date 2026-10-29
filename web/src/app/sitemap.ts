import type { MetadataRoute } from "next";
import { getCats, getPosts } from "@/lib/data";
import { SITE_URL } from "@/lib/format";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, posts] = await Promise.all([getCats(), getPosts()]);
  const pages = ["", "/gatos", "/adoptar", "/menu", "/visitanos", "/nosotros", "/concientizacion", "/blog", "/apadrina", "/ayudar", "/contacto"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...cats.map((c) => ({ url: `${SITE_URL}/gatos/${c.slug}`, lastModified: c.updated_at, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updated_at, priority: 0.5 })),
  ];
}
