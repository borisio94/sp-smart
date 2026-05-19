import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { ServiceCard } from "@/components/services/service-card";
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard
              key={s._id}
              service={s}
              locale={locale}
              cta={tc("readMore")}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="Aucun service publié pour le moment. Ajoutez vos services depuis l'administration (/studio)." />
      )}
    </Section>
  );
}
