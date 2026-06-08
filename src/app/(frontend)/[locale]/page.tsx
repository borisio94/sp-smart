import { getTranslations, setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { ServicesShowcase } from "@/components/services/services-showcase";
import { ArticleCard } from "@/components/articles/article-card";
import { urlForImage } from "../../../../sanity/lib/image";
import { Hero } from "@/components/home/hero";
import { PromoBanner } from "@/components/home/promo-banner";
import { Stats } from "@/components/home/stats";
import { WhyUs } from "@/components/home/why-us";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { PartnersStrip } from "@/components/home/partners-strip";
import { CtaSection } from "@/components/home/cta-section";
import { RealizationsCounter } from "@/components/public/realizations-counter";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import {
  homePageQuery,
  servicesListQuery,
  activePromotionsQuery,
  testimonialsQuery,
  latestArticlesQuery,
  partnersQuery,
} from "../../../../sanity/lib/queries";
import type {
  HomePage,
  ServiceCardData,
  PromotionBanner,
  Testimonial,
  ArticleCard as ArticleCardData,
  Partner,
} from "../../../../sanity/lib/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const tc = await getTranslations("Common");

  const [home, services, promotions, testimonials, articles, partners] =
    await Promise.all([
      sanityFetch<HomePage>(homePageQuery, {}, null),
      sanityFetch<ServiceCardData[]>(servicesListQuery, {}, []),
      sanityFetch<PromotionBanner[]>(activePromotionsQuery, {}, []),
      sanityFetch<Testimonial[]>(testimonialsQuery, {}, []),
      sanityFetch<ArticleCardData[]>(latestArticlesQuery, {}, []),
      sanityFetch<Partner[]>(partnersQuery, {}, []),
    ]);

  // Maps slug → image / description, consommées par la vitrine des services
  // (mise en avant des photos, regroupement par famille).
  const serviceSlugs = services
    .map((s) => s.slug)
    .filter((s): s is string => Boolean(s));
  const serviceDescriptions: Record<string, string> = {};
  const serviceImages: Record<string, string> = {};
  for (const s of services) {
    if (!s.slug) continue;
    serviceDescriptions[s.slug] = pickLocale(s.shortDescription, locale) ?? "";
    if (s.heroImage?.asset?._ref) {
      serviceImages[s.slug] = urlForImage(s.heroImage).width(600).height(400).url();
    }
  }

  return (
    <>
      <PromoBanner promotions={promotions} locale={locale} />
      <Hero data={home} locale={locale} />
      <Stats stats={home?.stats ?? []} locale={locale} />
      <RealizationsCounter locale={locale} />

      {/* Services */}
      <Section>
        <SectionHeader
          title={pickLocale(home?.servicesTitle, locale, t("services"))}
        />
        {services.length > 0 ? (
          <>
            <ServicesShowcase
              slugs={serviceSlugs}
              descriptions={serviceDescriptions}
              images={serviceImages}
              cta={tc("readMore")}
            />
            <div className="mt-10 text-center">
              <ButtonLink href="/services">{t("allServices")}</ButtonLink>
            </div>
          </>
        ) : (
          <EmptyState
            message="Aucun service publié pour le moment. Ajoutez vos services depuis l'administration (/studio)."
          />
        )}
      </Section>

      <WhyUs data={home} locale={locale} />

      <TestimonialsCarousel
        testimonials={testimonials}
        locale={locale}
        title={pickLocale(home?.testimonialsTitle, locale, "Témoignages")}
      />

      {/* Derniers articles */}
      {articles.length > 0 && (
        <Section tone="muted">
          <SectionHeader
            title={pickLocale(home?.blogTitle, locale, t("blog"))}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a._id} article={a} locale={locale} />
            ))}
          </div>
        </Section>
      )}

      <PartnersStrip
        partners={partners}
        title={pickLocale(home?.partnersTitle, locale, "Partenaires")}
      />

      <CtaSection data={home} locale={locale} />
    </>
  );
}
