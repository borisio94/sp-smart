/**
 * URL publique du site (sans slash final). Utilisée pour le SEO,
 * le sitemap, l'Open Graph et le JSON-LD.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
