import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { PromotionCard } from "@/components/promotions/promotion-card";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import { promotionsActiveQuery } from "../../../../../sanity/lib/queries";
import type { PromotionFull } from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("promotions") };
}

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const promotions = await sanityFetch<PromotionFull[]>(
    promotionsActiveQuery,
    {},
    [],
  );

  return (
    <Section>
      <SectionHeader title={t("promotions")} />
      {promotions.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => (
            <PromotionCard key={p._id} promo={p} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState message="Aucune promotion en cours pour le moment. Revenez bientôt !" />
      )}
    </Section>
  );
}
