import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { DevisForm } from "@/components/forms/devis-form";
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
  return { title: t("devisTitle") };
}

export default async function DevisPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale } = await params;
  const { service: serviceSlug } = await searchParams;
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

  const initialServiceId =
    services.find((s) => s.slug === serviceSlug)?._id ?? "";

  return (
    <Section>
      <SectionHeader title={t("devisTitle")} lead={t("devisIntro")} />
      <DevisForm services={options} initialServiceId={initialServiceId} />
    </Section>
  );
}
