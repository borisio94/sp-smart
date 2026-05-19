import { useTranslations } from "next-intl";

import { Section } from "@/components/layout/section";
import { Heading, Lead } from "@/components/layout/typography";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const tc = useTranslations("Common");

  return (
    <Section className="text-center">
      <Heading level={1}>{t("title")}</Heading>
      <Lead>{t("description")}</Lead>
      <ButtonLink href="/" className="mt-6">
        {tc("backHome")}
      </ButtonLink>
    </Section>
  );
}
