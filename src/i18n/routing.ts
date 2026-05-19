import { defineRouting } from "next-intl/routing";

/**
 * Configuration des langues du site.
 * FR = langue par défaut, EN = langue secondaire.
 * URLs préfixées : /fr/... et /en/...
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
