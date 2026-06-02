import { getTranslations } from "next-intl/server";

import { getPublicStats, totalRealizations } from "@/lib/billing/public-stats";
import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";

/**
 * Compteur public de réalisations (home / à propos).
 * Affiche le total cumulé et, en option, le top 3 des catégories.
 * Server Component avec revalidation horaire. Ne s'affiche pas si total = 0.
 */
export async function RealizationsCounter({ locale }: { locale: string }) {
  const stats = await getPublicStats();
  const total = totalRealizations(stats);
  if (total <= 0) return null;

  const t = await getTranslations("Realizations");

  const top3 = [...stats]
    .filter((s) => s.realized_count > 0)
    .sort((a, b) => b.realized_count - a.realized_count)
    .slice(0, 3);

  return (
    <Section tone="navy">
      <div className="text-center">
        <p className="text-4xl font-bold sm:text-5xl">
          {total}{" "}
          <span className="text-2xl font-medium text-white/80 sm:text-3xl">
            {t("totalSuffix")}
          </span>
        </p>
        {top3.length > 0 ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/85">
            {top3.map((s) => (
              <li key={s.slug}>
                <span className="font-semibold text-white">{s.realized_count}</span>{" "}
                {pickLocale({ fr: s.name_fr, en: s.name_en }, locale)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}
