import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";

import { pickLocale } from "@/lib/locale";
import { sanityFetch } from "../../../sanity/lib/fetch";
import { siteSettingsQuery } from "../../../sanity/lib/queries";
import type { SiteSettings } from "../../../sanity/lib/types";

/**
 * Bouton WhatsApp flottant (bas-droite).
 * Numéro et message pré-rempli configurés dans Sanity.
 * N'apparaît pas si aucun numéro n'est renseigné.
 */
export async function WhatsappButton({ locale }: { locale: string }) {
  const t = await getTranslations("Whatsapp");
  const settings = await sanityFetch<SiteSettings>(
    siteSettingsQuery,
    {},
    null,
  );

  const number = settings?.whatsappNumber?.replace(/\D/g, "");
  if (!number) return null;

  const message =
    pickLocale(settings?.whatsappMessage, locale) || t("defaultMessage");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#25D366] opacity-30" />
      <MessageCircle className="relative size-7" />
    </a>
  );
}
