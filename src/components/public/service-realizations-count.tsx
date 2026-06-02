import { getTranslations } from "next-intl/server";

import { getPublicStats, realizationsForService } from "@/lib/billing/public-stats";

/**
 * Badge « X installations réalisées » pour une page service.
 * Mappé du slug de service (Sanity) vers le slug de catégorie (Supabase).
 * Ne s'affiche pas si le compteur est à 0.
 */
export async function ServiceRealizationsCount({
  serviceSlug,
}: {
  serviceSlug: string;
}) {
  const stats = await getPublicStats();
  const count = realizationsForService(stats, serviceSlug);
  if (count <= 0) return null;

  const t = await getTranslations("Realizations");

  return (
    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white">
      <span className="text-base font-bold">{count}</span>
      {t("serviceCount")}
    </p>
  );
}
