import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

/**
 * Charge les traductions de la langue demandée pour chaque requête serveur.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
