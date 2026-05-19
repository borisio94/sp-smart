import { getTranslations } from "next-intl/server";
import { Hammer } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/layout/section";
import { Heading, Lead } from "@/components/layout/typography";

/**
 * Page provisoire « Bientôt disponible » pour les sections pas encore
 * implémentées. Affichée avec l'en-tête et le pied de page habituels —
 * jamais une erreur brute.
 */
export async function ComingSoon({ title }: { title?: string }) {
  const t = await getTranslations("ComingSoon");

  return (
    <Section className="text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-brand">
          <Hammer className="size-4" />
          {t("badge")}
        </span>
        <Heading level={1} className="mt-6">
          {title ?? t("title")}
        </Heading>
        <Lead className="mx-auto">{t("description")}</Lead>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">{t("homeCta")}</ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            {t("contactCta")}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
