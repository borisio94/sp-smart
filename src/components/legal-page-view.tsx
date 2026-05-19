import { setRequestLocale } from "next-intl/server";

import { pickLocale, pickLocaleBlock } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/layout/typography";
import { PortableText } from "@/components/portable-text";
import { EmptyState } from "@/components/empty-state";
import { sanityFetch } from "../../sanity/lib/fetch";
import { legalPageByTypeQuery } from "../../sanity/lib/queries";
import type { LegalPage } from "../../sanity/lib/types";

/**
 * Rendu d'une page légale (contenu rédigé dans l'administration Sanity).
 */
export async function LegalPageView({
  type,
  fallbackTitle,
  locale,
}: {
  type: string;
  fallbackTitle: string;
  locale: string;
}) {
  setRequestLocale(locale);

  const page = await sanityFetch<LegalPage>(
    legalPageByTypeQuery,
    { type },
    null,
  );

  const title = pickLocale(page?.title, locale) || fallbackTitle;
  const content = pickLocaleBlock(page?.content, locale);

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <Heading level={1}>{title}</Heading>
        {page?.updatedAt && (
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(page.updatedAt).toLocaleDateString(
              locale === "en" ? "en-GB" : "fr-FR",
              { year: "numeric", month: "long", day: "numeric" },
            )}
          </p>
        )}
        <div className="mt-8">
          {content.length > 0 ? (
            <PortableText value={content} />
          ) : (
            <EmptyState message="Contenu à rédiger depuis l'administration (/studio)." />
          )}
        </div>
      </div>
    </Section>
  );
}
