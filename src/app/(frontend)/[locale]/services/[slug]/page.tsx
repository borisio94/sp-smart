import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale, pickLocaleBlock } from "@/lib/locale";
import { youtubeEmbedUrl } from "@/lib/video";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Heading } from "@/components/layout/typography";
import { ButtonLink } from "@/components/ui/button-link";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { DynamicIcon } from "@/components/dynamic-icon";
import { ServiceRealizationsCount } from "@/components/public/service-realizations-count";
import { sanityFetch } from "../../../../../../sanity/lib/fetch";
import {
  serviceBySlugQuery,
  serviceSlugsQuery,
} from "../../../../../../sanity/lib/queries";
import type { ServiceDetail } from "../../../../../../sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(serviceSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await sanityFetch<ServiceDetail | null>(
    serviceBySlugQuery,
    { slug },
    null,
  );
  if (!service) return {};
  const title =
    pickLocale(service.seo?.metaTitle, locale) ||
    pickLocale(service.title, locale);
  const description =
    pickLocale(service.seo?.metaDescription, locale) ||
    pickLocale(service.shortDescription, locale);
  return {
    title,
    description,
    robots: service.seo?.noIndex ? { index: false } : undefined,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const tDetail = await getTranslations("ServiceDetail");
  const service = await sanityFetch<ServiceDetail | null>(
    serviceBySlugQuery,
    { slug },
    null,
  );

  if (!service) notFound();

  const title = pickLocale(service.title, locale);
  const longDesc = pickLocaleBlock(service.longDescription, locale);
  const embed = youtubeEmbedUrl(service.videoUrl);
  const devisHref = `/devis?service=${service.slug ?? slug}`;

  return (
    <>
      {/* En-tête */}
      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        {service.heroImage?.asset?._ref && (
          <SanityImage
            image={service.heroImage}
            alt={title}
            width={1920}
            height={800}
            priority
            className="absolute inset-0 -z-10 size-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-navy/90 to-brand/60" />
        <Container className="py-20 sm:py-28">
          <Heading level={1} className="text-white">
            {title}
          </Heading>
          <p className="mt-4 max-w-2xl text-lg text-white/85">
            {pickLocale(service.shortDescription, locale)}
          </p>
          <div>
            <ServiceRealizationsCount serviceSlug={service.slug ?? slug} />
          </div>
          <ButtonLink
            size="lg"
            variant="secondary"
            className="mt-8"
            href={devisHref}
          >
            {t("quote")}
          </ButtonLink>
        </Container>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {longDesc.length > 0 && <PortableText value={longDesc} />}

            {embed && (
              <div className="mt-8 aspect-video overflow-hidden rounded-lg">
                <iframe
                  src={embed}
                  title={title}
                  allowFullScreen
                  className="size-full"
                  loading="lazy"
                />
              </div>
            )}

            {service.gallery && service.gallery.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {service.gallery.map((img, i) => (
                  <SanityImage
                    key={i}
                    image={img}
                    alt={img?.alt ?? title}
                    width={500}
                    height={375}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Colonne latérale : avantages / caractéristiques */}
          <aside className="space-y-8">
            {service.advantages && service.advantages.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-6">
                <h2 className="font-semibold">{tDetail("advantages")}</h2>
                <ul className="mt-4 space-y-4">
                  {service.advantages.map((a, i) => {
                    const advTitle = pickLocale(a.title, locale);
                    const advDesc = pickLocale(a.description, locale);
                    return (
                      <li key={i} className="flex gap-3">
                        <DynamicIcon
                          name={a.icon ?? "check"}
                          className="mt-0.5 size-5 shrink-0 text-brand"
                        />
                        <div>
                          <h3 className="text-sm font-semibold">{advTitle}</h3>
                          {advDesc && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {advDesc}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {service.features && service.features.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-6">
                <h2 className="font-semibold">{tDetail("features")}</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {service.features.map((f, i) => (
                    <li key={i}>{pickLocale(f, locale)}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* FAQ */}
        {service.faq && service.faq.length > 0 && (
          <div className="mt-16 mx-auto max-w-3xl">
            <Heading level={2} className="mb-6 text-center">
              {tDetail("faq")}
            </Heading>
            <div className="space-y-3">
              {service.faq.map((item) => (
                <details
                  key={item._id}
                  className="group rounded-lg border bg-background p-4"
                >
                  <summary className="cursor-pointer font-medium">
                    {pickLocale(item.question, locale)}
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {pickLocale(item.answer, locale)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
