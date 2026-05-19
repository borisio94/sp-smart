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
  return { title: t("terms") };
}

export default async function CgvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Footer" });
  return (
    <LegalPageView type="cgv" fallbackTitle={t("terms")} locale={locale} />
  );
}
