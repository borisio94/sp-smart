import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageView } from "@/components/legal-page-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Footer" });
  return { title: t("privacy") };
}

export default async function PolitiqueConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Footer" });
  return (
    <LegalPageView
      type="politique-confidentialite"
      fallbackTitle={t("privacy")}
      locale={locale}
    />
  );
}
