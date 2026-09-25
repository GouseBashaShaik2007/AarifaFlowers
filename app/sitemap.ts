import type { MetadataRoute } from "next";
import { LANGS, OCCASIONS } from "@/lib/catalog";
import { listProducts } from "@/lib/store";
import { SITE_URL } from "@/lib/whatsapp";

// Built fresh on request, like the rest of the site, so a garland added this morning is in it this morning.
export const dynamic = "force-dynamic";

/**
 * The list of addresses handed to search engines. Every page appears once per language, each one naming the
 * others, so a Hindi reader is offered the Hindi page. The saved list and the try-on previews are left out:
 * they belong to one visitor and are marked not to be indexed anyway.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = (path: string) => ({
    ...Object.fromEntries(LANGS.map((l) => [l, `${SITE_URL}/${l}${path}`])),
    "x-default": `${SITE_URL}/en${path}`,
  });

  const pages = (path: string, priority: number, lastModified?: string) =>
    LANGS.map((l) => ({
      url: `${SITE_URL}/${l}${path}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority,
      alternates: { languages: languages(path) },
    }));

  // A sitemap that cannot reach the garlands is still worth serving, so a failure only costs the garland pages.
  let products: Awaited<ReturnType<typeof listProducts>> = [];
  try {
    products = await listProducts();
  } catch {
    products = [];
  }

  return [
    ...pages("", 1),
    ...pages("/garlands", 0.9),
    ...OCCASIONS.flatMap((o) => pages(`/occasions/${o.id}`, 0.8)),
    ...pages("/custom", 0.7),
    ...products.flatMap((p) => pages(`/garlands/${p.id}`, 0.6, p.updatedAt)),
  ];
}
