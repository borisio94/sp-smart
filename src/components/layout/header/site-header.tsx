import { getTranslations } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/layout/container";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import {
  siteSettingsQuery,
  servicesNavQuery,
} from "../../../../sanity/lib/queries";
import type {
  SiteSettings,
  ServiceNavItem,
} from "../../../../sanity/lib/types";
import { Logo } from "./logo";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
import type { ServiceLink } from "./nav-links";

/**
 * En-tête du site (sticky) : logo, navigation, langue, CTA devis.
 * Données issues de Sanity (vides tant que le projet n'est pas configuré).
 */
export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("Nav");

  const [settings, services] = await Promise.all([
    sanityFetch<SiteSettings>(siteSettingsQuery, {}, null),
    sanityFetch<ServiceNavItem[]>(servicesNavQuery, {}, []),
  ]);

  const serviceLinks: ServiceLink[] = (services ?? []).map((s) => ({
    id: s._id,
    title: pickLocale(s.title, locale),
    slug: s.slug ?? "",
    icon: s.icon,
  }));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo settings={settings} />

        <DesktopNav services={serviceLinks} />

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ButtonLink href="/devis" className="hidden sm:inline-flex">
            {t("quote")}
          </ButtonLink>
          <MobileNav services={serviceLinks} />
        </div>
      </Container>
    </header>
  );
}
