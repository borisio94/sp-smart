import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MapPin, User, CalendarDays } from "lucide-react";

import { pickLocale } from "@/lib/locale";
import { youtubeEmbedUrl } from "@/lib/video";
import { Section } from "@/components/layout/section";
import { Heading, Lead } from "@/components/layout/typography";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { sanityFetch } from "../../../../../../sanity/lib/fetch";
import {
  realisationBySlugQuery,
  realisationSlugsQuery,
} from "../../../../../../sanity/lib/queries";
import type { RealisationDetail } from "../../../../../../sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(realisationSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await sanityFetch<RealisationDetail | null>(
    realisationBySlugQuery,
    { slug },
    null,
  );
  if (!item) return {};
  return {
    title: pickLocale(item.title, locale),
    description: pickLocale(item.description, locale) || undefined,
  };
}

export default async function RealisationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const item = await sanityFetch<RealisationDetail | null>(
    realisationBySlugQuery,
    { slug },
    null,
  );
  if (!item) notFound();

  const title = pickLocale(item.title, locale);
  const service = pickLocale(item.serviceTitle, locale);
  const embed = youtubeEmbedUrl(item.videoUrl);
  const dateStr = item.date
    ? new Date(item.date).toLocaleDateString(
        locale === "en" ? "en-GB" : "fr-FR",
        { year: "numeric", month: "long" },
      )
    : "";

  return (
    <Section>
      {service && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {service}
        </p>
      )}
      <Heading level={1} className="mt-2">
        {title}
      </Heading>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {item.client && (
          <span className="inline-flex items-center gap-1">
            <User className="size-4" />
            {item.client}
          </span>
        )}
        {item.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" />
            {item.location}
          </span>
        )}
        {dateStr && (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" />
            {dateStr}
          </span>
        )}
      </div>

      {item.description && <Lead>{pickLocale(item.description, locale)}</Lead>}

      {item.beforeImages && item.beforeImages.length > 0 && (
        <div className="mt-12">
          <Heading level={3} className="mb-4">
            {locale === "en" ? "Before" : "Avant"}
          </Heading>
          <GalleryLightbox images={item.beforeImages} title={`${title} — avant`} />
        </div>
      )}

      {item.afterImages && item.afterImages.length > 0 && (
        <div className="mt-12">
          <Heading level={3} className="mb-4">
            {locale === "en" ? "After" : "Après"}
          </Heading>
          <GalleryLightbox images={item.afterImages} title={`${title} — après`} />
        </div>
      )}

      {embed && (
        <div className="mt-12 aspect-video overflow-hidden rounded-lg">
          <iframe
            src={embed}
            title={title}
            allowFullScreen
            loading="lazy"
            className="size-full"
          />
        </div>
      )}
    </Section>
  );
}
