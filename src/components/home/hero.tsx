import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import { SanityImage } from "@/components/sanity-image";
import { ButtonLink } from "@/components/ui/button-link";
import type { HomePage } from "../../../sanity/lib/types";

function ctaHref(href?: string) {
  return href && href.length > 0 ? href : "/devis";
}

/**
 * Bannière d'accueil (hero) : image/vidéo de fond, titre, sous-titre, CTA.
 */
export function Hero({ data, locale }: { data: HomePage; locale: string }) {
  const title = pickLocale(data?.heroTitle, locale, "SP Smart Sarl");
  const subtitle = pickLocale(data?.heroSubtitle, locale);
  const primary = data?.heroPrimaryCta;
  const secondary = data?.heroSecondaryCta;

  return (
    <section className="relative isolate overflow-hidden bg-brand-navy text-white">
      {data?.heroImage?.asset?._ref && (
        <SanityImage
          image={data.heroImage}
          alt={title}
          width={1920}
          height={1080}
          priority
          className="absolute inset-0 -z-10 size-full object-cover"
        />
      )}
      {/* Voile dégradé : assez sombre à gauche (lisibilité du texte) et plus
          léger à droite pour laisser l'image de fond bien visible. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-navy/80 via-brand-navy/45 to-transparent" />

      <Container className="py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-2xl text-lg text-white/85">{subtitle}</p>
          )}
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink size="lg" href={ctaHref(primary?.href)}>
              {pickLocale(primary?.label, locale, "Devis gratuit")}
            </ButtonLink>
            {secondary?.label && (
              <ButtonLink
                size="lg"
                variant="outline"
                className="bg-white/10 text-white"
                href={ctaHref(secondary?.href)}
              >
                {pickLocale(secondary?.label, locale)}
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
