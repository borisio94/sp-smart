import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { urlForImage } from "../../../../../sanity/lib/image";
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

  // Slugs publiés (anti-404) + descriptions courtes + image illustrative,
  // indexés par slug, consommés par les onglets (taxonomie curatée du menu).
  const slugs = services.map((s) => s.slug).filter((s): s is string => Boolean(s));
  const descriptions: Record<string, string> = {};
  const images: Record<string, string> = {};
  for (const s of services) {
    if (!s.slug) continue;
    descriptions[s.slug] = pickLocale(s.shortDescription, locale) ?? "";
    if (s.heroImage?.asset?._ref) {
      images[s.slug] = urlForImage(s.heroImage).width(600).height(400).url();
    }
  }

  return (
    <Section>
      <SectionHeader title={t("services")} />
      {slugs.length > 0 ? (
        <ServicesTabs
          slugs={slugs}
          descriptions={descriptions}
          images={images}
          cta={tc("readMore")}
        />
      ) : (
        <EmptyState message="Aucun service publié pour le moment. Ajoutez vos services depuis l'administration (/studio)." />
      )}
    </Section>
  );
}
