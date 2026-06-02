import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

/**
 * Proxy Next.js (ex-« middleware »).
 * - Routes /admin (module Billing, non localisé) → refresh de session Supabase.
 * - Tout le reste → middleware i18n next-intl (langues /fr et /en).
 * Le Studio Sanity et /api sont exclus via le `matcher` ci-dessous.
 */
const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateSession(request);
  }
  return intlMiddleware(request);
}

export const config = {
  /**
   * Exécuté sur toutes les routes SAUF :
   * - /studio (administration Sanity, non localisée)
   * - /facture-privee (lien public de document, non localisé)
   * - /api, /_next, /_vercel
   * - les fichiers statiques (contiennent un point)
   * /admin est volontairement INCLUS (géré ci-dessus).
   */
  matcher: ["/((?!studio|facture-privee|api|_next|_vercel|.*\\..*).*)"],
};
