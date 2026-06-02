import "server-only";

import { sanityFetch } from "../../../../sanity/lib/fetch";
import { siteSettingsQuery } from "../../../../sanity/lib/queries";
import { urlForImage } from "../../../../sanity/lib/image";
import type { SiteSettings } from "../../../../sanity/lib/types";

/**
 * Récupère le logo du site (Sanity) et le convertit en Data URI base64,
 * utilisable par <Image src> de react-pdf. Sert de logo par défaut sur les
 * documents quand aucun logo n'a été uploadé dans le bucket `branding`.
 * Tolérant : renvoie null si Sanity n'est pas configuré ou en cas d'erreur.
 */
export async function fetchSiteLogoDataUri(): Promise<string | null> {
  try {
    const settings = await sanityFetch<SiteSettings | null>(
      siteSettingsQuery,
      {},
      null,
    );
    const ref = settings?.logo?.asset?._ref;
    if (!ref) return null;

    // Logo en PNG sur fond transparent, largeur raisonnable pour le PDF.
    const url = urlForImage(settings!.logo!).width(400).format("png").url();
    const res = await fetch(url);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
