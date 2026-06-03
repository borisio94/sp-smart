import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import { buildServiceMenu } from "@/components/layout/header/service-menu";
import { sanityFetch } from "../../../../sanity/lib/fetch";
import {
  siteSettingsQuery,
  servicesNavQuery,
} from "../../../../sanity/lib/queries";
import type {
  SiteSettings,
  ServiceNavItem,
} from "../../../../sanity/lib/types";
import { NewsletterForm } from "./newsletter-form";
import { SocialLinks } from "./social-links";

/**
 * Pied de page : 4 colonnes, newsletter, réseaux sociaux, copyright dynamique.
 * Données issues de Sanity (vides tant que le projet n'est pas configuré).
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations("Footer");
  const tn = await getTranslations("Nav");
  const tc = await getTranslations("Common");

  const [settings, services] = await Promise.all([
    sanityFetch<SiteSettings>(siteSettingsQuery, {}, null),
    sanityFetch<ServiceNavItem[]>(servicesNavQuery, {}, []),
  ]);

  const companyName = settings?.companyName ?? "SP Smart Sarl";
  const year = new Date().getFullYear();

  // Services du pied : même taxonomie curatée que le menu (familles + branches),
  // filtrée sur les slugs réellement publiés (anti-404).
  const serviceMenu = buildServiceMenu(
    (services ?? []).map((s) => s.slug ?? "").filter(Boolean),
  );

  return (
    <footer className="mt-auto bg-brand-navy text-white">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Colonne 1 : entreprise */}
          <div>
            <p className="text-lg font-bold">{companyName}</p>
            {settings?.slogan && (
              <p className="mt-2 text-sm text-white/70">
                {pickLocale(settings.slogan, locale)}
              </p>
            )}
            <div className="mt-4">
              <SocialLinks socials={settings?.socials} />
            </div>
          </div>

          {/* Colonne 2 : services (taxonomie curatée, groupée par famille) */}
          <nav aria-label={t("services")}>
            <p className="font-semibold">{t("services")}</p>
            <div className="mt-4 space-y-3 text-sm">
              {serviceMenu.map((fam) => (
                <div key={fam.family}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    {tn(`serviceFamily.${fam.family}`)}
                  </p>
                  <ul className="mt-1 space-y-1 text-white/70">
                    {fam.items.map((item) => (
                      <li key={item.labelKey}>
                        <Link
                          href={`/services/${item.slug}`}
                          className="hover:text-white"
                        >
                          {tn(`serviceItems.${item.labelKey}`)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Colonne 3 : liens utiles */}
          <nav aria-label={t("usefulLinks")}>
            <p className="font-semibold">{t("usefulLinks")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/a-propos" className="hover:text-white">
                  {tn("about")}
                </Link>
              </li>
              <li>
                <Link href="/realisations" className="hover:text-white">
                  {tn("realisations")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  {tn("blog")}
                </Link>
              </li>
              <li>
                <Link href="/devis" className="hover:text-white">
                  {tn("quote")}
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-white">
                  {t("legalNotice")}
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  className="hover:text-white"
                >
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Colonne 4 : contact + newsletter */}
          <div>
            <p className="font-semibold">{t("contact")}</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {settings?.phones?.map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-white">
                    {p}
                  </a>
                </li>
              ))}
              {settings?.emails?.map((e) => (
                <li key={e}>
                  <a href={`mailto:${e}`} className="hover:text-white">
                    {e}
                  </a>
                </li>
              ))}
              {settings?.address && (
                <li className="whitespace-pre-line">{settings.address}</li>
              )}
            </ul>

            <p className="mt-6 font-semibold">{t("newsletterTitle")}</p>
            <p className="mt-1 text-sm text-white/70">{t("newsletterText")}</p>
            <div className="mt-3">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          © {year} {companyName}. {tc("allRightsReserved")}
        </div>
      </Container>
    </footer>
  );
}
