import { siteUrl } from "@/lib/site";
import { sanityFetch } from "../../sanity/lib/fetch";
import { siteSettingsQuery } from "../../sanity/lib/queries";
import type { SiteSettings } from "../../sanity/lib/types";

const DAY_MAP: Record<string, string> = {
  lundi: "Monday",
  mardi: "Tuesday",
  mercredi: "Wednesday",
  jeudi: "Thursday",
  vendredi: "Friday",
  samedi: "Saturday",
  dimanche: "Sunday",
};

/**
 * Données structurées JSON-LD (LocalBusiness) pour le SEO local Cameroun.
 * Injectées sur tout le site depuis les informations Sanity.
 */
export async function JsonLd() {
  const settings = await sanityFetch<SiteSettings>(
    siteSettingsQuery,
    {},
    null,
  );
  if (!settings) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.companyName || "SP Smart Sarl",
    url: siteUrl,
    telephone: settings.phones?.[0],
    email: settings.emails?.[0],
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address,
          addressCountry: "CM",
        }
      : undefined,
    geo:
      settings.geo?.lat && settings.geo?.lng
        ? {
            "@type": "GeoCoordinates",
            latitude: settings.geo.lat,
            longitude: settings.geo.lng,
          }
        : undefined,
    sameAs: settings.socials?.map((s) => s.url).filter(Boolean),
    openingHoursSpecification: settings.openingHours
      ?.filter((h) => !h.closed && h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_MAP[h.day ?? ""] ?? h.day,
        opens: h.open,
        closes: h.close,
      })),
  };

  return (
    <script
      type="application/ld+json"
      // Données contrôlées (issues de Sanity), sérialisation sûre
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
