import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { sanityFetch } from "../../sanity/lib/fetch";
import {
  serviceSlugsQuery,
  realisationSlugsQuery,
  articleSlugsQuery,
  categorySlugsQuery,
} from "../../sanity/lib/queries";

// Pages statiques (sans le préfixe de langue)
const STATIC_PATHS = [
  "",
  "/services",
  "/realisations",
  "/promotions",
  "/blog",
  "/a-propos",
  "/contact",
  "/devis",
  "/rendez-vous",
  "/mentions-legales",
  "/politique-confidentialite",
  "/cgv",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, realisations, articles, categories] = await Promise.all([
    sanityFetch<string[]>(serviceSlugsQuery, {}, []),
    sanityFetch<string[]>(realisationSlugsQuery, {}, []),
    sanityFetch<string[]>(articleSlugsQuery, {}, []),
    sanityFetch<string[]>(categorySlugsQuery, {}, []),
  ]);

  const dynamicPaths = [
    ...services.map((s) => `/services/${s}`),
    ...realisations.map((s) => `/realisations/${s}`),
    ...articles.map((s) => `/blog/${s}`),
    ...categories.map((s) => `/blog/categorie/${s}`),
  ];

  const allPaths = [...STATIC_PATHS, ...dynamicPaths];
  const now = new Date();

  return allPaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: now,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}
