import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { RdvForm } from "@/components/forms/rdv-form";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import { servicesListQuery } from "../../../../../sanity/lib/queries";
import type { ServiceCardData } from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Forms" });
  return { title: t("rdvTitle") };
}

export default async function RendezVousPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Forms");
  const services = await sanityFetch<ServiceCardData[]>(
    servicesListQuery,
    {},
    [],
  );
  const options = services.map((s) => ({
    id: s._id,
    label: pickLocale(s.title, locale),
  }));

  return (
    <Section>
      <SectionHeader title={t("rdvTitle")} lead={t("rdvIntro")} />
      <RdvForm services={options} />
    </Section>
  );
}
