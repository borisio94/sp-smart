import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { pickLocale } from "@/lib/locale";
import { siteUrl } from "@/lib/site";
import { SiteHeader } from "@/components/layout/header/site-header";
import { SiteFooter } from "@/components/layout/footer/site-footer";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { JsonLd } from "@/components/json-ld";
import { Toaster } from "@/components/ui/sonner";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import {
  siteSettingsQuery,
  homePageQuery,
} from "../../../../sanity/lib/queries";
import type {
  SiteSettings,
  HomePage,
} from "../../../../sanity/lib/types";
import "../../globals.css";

// Police de marque : Inter (sans-serif moderne, professionnel)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Métadonnées dynamiques (SEO global depuis Sanity). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [settings, home] = await Promise.all([
    sanityFetch<SiteSettings>(siteSettingsQuery, {}, null),
    sanityFetch<HomePage>(homePageQuery, {}, null),
  ]);

  const name = settings?.companyName || "SP Smart Sarl";
  const slogan = pickLocale(settings?.slogan, locale);
  const title =
    pickLocale(home?.seo?.metaTitle, locale) ||
    (slogan ? `${name} — ${slogan}` : name);
  const description =
    pickLocale(home?.seo?.metaDescription, locale) ||
    pickLocale(home?.heroSubtitle, locale) ||
    "Fourniture et installation d'équipements de sécurité et d'électricité au Cameroun.";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s — ${name}` },
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en" },
    },
    openGraph: {
      title,
      description,
      siteName: name,
      locale: locale === "en" ? "en_US" : "fr_FR",
      type: "website",
      url: `${siteUrl}/${locale}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Génère les versions statiques /fr et /en. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Active le rendu statique pour cette langue
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <JsonLd />
        <NextIntlClientProvider>
          <SiteHeader locale={locale} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} />
          <WhatsappButton locale={locale} />
          <CookieBanner />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
