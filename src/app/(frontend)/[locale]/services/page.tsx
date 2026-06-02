import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { ServicesTabs } from "@/components/services/services-tabs";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import { servicesListQuery } from "../../../../../sanity/lib/queries";
import type { ServiceCardData } from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("services") };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const tc = await getTranslations("Common");
  const services = await sanityFetch<ServiceCardData[]>(
    servicesListQuery,
    {},
    [],
  );

  return (
    <Section>
      <SectionHeader title={t("services")} />
      {services.length > 0 ? (
        <ServicesTabs services={services} locale={locale} cta={tc("readMore")} />
      ) : (
        <EmptyState message="Aucun service publié pour le moment. Ajoutez vos services depuis l'administration (/studio)." />
      )}
    </Section>
  );
}
