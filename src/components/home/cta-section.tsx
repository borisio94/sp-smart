import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import { ButtonLink } from "@/components/ui/button-link";
import type { HomePage } from "../../../sanity/lib/types";

/**
 * Section d'appel à l'action final (bas de l'accueil).
 */
export function CtaSection({
  data,
  locale,
}: {
  data: HomePage;
  locale: string;
}) {
  const title = pickLocale(data?.ctaTitle, locale);
  if (!title) return null;

  return (
    <section className="bg-brand text-brand-foreground">
      <Container className="py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-brand-foreground/85">
          {pickLocale(data?.ctaText, locale)}
        </p>
        <ButtonLink
          size="lg"
          variant="secondary"
          className="mt-8"
          href={data?.ctaButton?.href || "/devis"}
        >
          {pickLocale(data?.ctaButton?.label, locale, "Devis gratuit")}
        </ButtonLink>
      </Container>
    </section>
  );
}
