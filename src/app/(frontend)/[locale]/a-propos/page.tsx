import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale, pickLocaleBlock } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { Heading, Lead } from "@/components/layout/typography";
import { DynamicIcon } from "@/components/dynamic-icon";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { PartnersStrip } from "@/components/home/partners-strip";
import { EmptyState } from "@/components/empty-state";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import {
  aboutPageQuery,
  teamQuery,
  partnersQuery,
} from "../../../../../sanity/lib/queries";
import type {
  AboutPage,
  TeamMember,
  Partner,
} from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  const about = await sanityFetch<AboutPage>(aboutPageQuery, {}, null);
  return {
    title: pickLocale(about?.title, locale) || t("about"),
    description: pickLocale(about?.missionText, locale) || undefined,
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const [about, team, partners] = await Promise.all([
    sanityFetch<AboutPage>(aboutPageQuery, {}, null),
    sanityFetch<TeamMember[]>(teamQuery, {}, []),
    sanityFetch<Partner[]>(partnersQuery, {}, []),
  ]);

  const intro = pickLocaleBlock(about?.intro, locale);
  const title = pickLocale(about?.title, locale) || t("about");

  return (
    <>
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Heading level={1}>{title}</Heading>
            {about?.missionText && (
              <Lead>{pickLocale(about.missionText, locale)}</Lead>
            )}
            {intro.length > 0 && (
              <div className="mt-6">
                <PortableText value={intro} />
              </div>
            )}
            {!about && (
              <div className="mt-6">
                <EmptyState message="Contenu « À propos » à renseigner depuis l'administration (/studio)." />
              </div>
            )}
          </div>
          {about?.image?.asset?._ref && (
            <SanityImage
              image={about.image}
              alt={title}
              width={800}
              height={600}
              className="h-auto w-full rounded-xl object-cover"
            />
          )}
        </div>
      </Section>

      {about?.values && about.values.length > 0 && (
        <Section tone="muted">
          <SectionHeader
            title={pickLocale(about.missionTitle, locale, "Nos valeurs")}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {about.values.map((v, i) => (
              <div key={i} className="rounded-lg bg-background p-6 shadow-sm">
                <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-brand">
                  <DynamicIcon name={v.icon} className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {pickLocale(v.title, locale)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pickLocale(v.description, locale)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {team.length > 0 && (
        <Section>
          <SectionHeader
            title={pickLocale(about?.teamTitle, locale, "Notre équipe")}
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <div key={m._id} className="text-center">
                {m.photo?.asset?._ref && (
                  <SanityImage
                    image={m.photo}
                    alt={m.name ?? ""}
                    width={240}
                    height={240}
                    className="mx-auto size-40 rounded-full object-cover"
                  />
                )}
                <p className="mt-4 font-semibold">{m.name}</p>
                <p className="text-sm text-brand">
                  {pickLocale(m.role, locale)}
                </p>
                {m.bio && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {pickLocale(m.bio, locale)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <PartnersStrip
        partners={partners}
        title={pickLocale(about?.partnersTitle, locale, "Partenaires")}
      />
    </>
  );
}
