import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Proxy Next.js (ex-« middleware ») : redirige vers la bonne langue
 * et gère les URLs /fr et /en.
 */
export default createMiddleware(routing);

export const config = {
  /**
   * Exécuté sur toutes les routes SAUF :
   * - /studio (administration Sanity, non localisée)
   * - /api, /_next, /_vercel
   * - les fichiers statiques (contiennent un point)
   */
  matcher: ["/((?!studio|api|_next|_vercel|.*\\..*).*)"],
};
