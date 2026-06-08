import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button-link";
import { HeroSlideshow, type HeroSlide } from "@/components/home/hero-slideshow";
import { urlForImage } from "../../../sanity/lib/image";
import type { HomePage, SanityImageRef } from "../../../sanity/lib/types";

function ctaHref(href?: string) {
  return href && href.length > 0 ? href : "/devis";
}

/**
 * Bannière d'accueil (hero) : diaporama/image de fond, titre, sous-titre, CTA.
 * Si `heroImages` (diaporama) contient des images, elles défilent en fondu ;
 * sinon on retombe sur `heroImage` (image unique).
 */
export function Hero({ data, locale }: { data: HomePage; locale: string }) {
  const title = pickLocale(data?.heroTitle, locale, "SP Smart Sarl");
  const subtitle = pickLocale(data?.heroSubtitle, locale);
  const primary = data?.heroPrimaryCta;
  const secondary = data?.heroSecondaryCta;

  // Sources du diaporama : `heroImages` si renseigné, sinon l'image unique.
  const rawSlides =
    data?.heroImages && data.heroImages.length > 0
      ? data.heroImages
      : data?.heroImage
        ? [data.heroImage]
        : [];
  const slides: HeroSlide[] = rawSlides
    .filter((img): img is SanityImageRef & { alt?: string } =>
      Boolean(img?.asset?._ref),
    )
    .map((img) => ({
      url: urlForImage(img).width(1920).height(1080).url(),
      alt: img?.alt || title,
    }));

  return (
    <section className="relative isolate overflow-hidden bg-brand-navy text-white">
      <HeroSlideshow slides={slides} />
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
