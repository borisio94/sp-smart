import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { RealisationsFilter } from "@/components/realisations/realisations-filter";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import {
  realisationsListQuery,
  servicesListQuery,
} from "../../../../../sanity/lib/queries";
import type {
  RealisationCard,
  ServiceCardData,
} from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("realisations") };
}

export default async function RealisationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const [items, services] = await Promise.all([
    sanityFetch<RealisationCard[]>(realisationsListQuery, {}, []),
    sanityFetch<ServiceCardData[]>(servicesListQuery, {}, []),
  ]);

  const serviceOptions = services.map((s) => ({
    id: s._id,
    label: pickLocale(s.title, locale),
  }));

  return (
    <Section>
      <SectionHeader title={t("realisations")} />
      {items.length > 0 ? (
        <RealisationsFilter
          items={items}
          services={serviceOptions}
          locale={locale}
        />
      ) : (
        <EmptyState message="Aucune réalisation publiée pour le moment. Ajoutez vos projets depuis l'administration (/studio)." />
      )}
    </Section>
  );
}
