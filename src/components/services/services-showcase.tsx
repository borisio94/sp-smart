"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { buildServiceMenu } from "@/components/layout/header/service-menu";

/**
 * Vitrine des services SUR UNE SEULE PAGE : tous les services regroupés par
 * famille (taxonomie curatée `service-menu`), chaque famille formant un bloc
 * que l'on fait défiler horizontalement. Chaque carte met en avant la PHOTO du
 * service (l'icône n'est qu'une pastille de repère). Pas d'onglets : tout est
 * visible en faisant défiler la page.
 *
 * Reçoit la liste des slugs publiés (anti-404), un dictionnaire d'images
 * (slug → URL pré-résolue) et de descriptions (slug → texte localisé), calculés
 * côté serveur.
 */
export function ServicesShowcase({
  slugs,
  descriptions,
  images,
  cta,
}: {
  slugs: string[];
  descriptions: Record<string, string>;
  images: Record<string, string>;
  cta: string;
}) {
  const t = useTranslations("Nav");
  const menu = buildServiceMenu(slugs);

  if (menu.length === 0) return null;

  return (
    <div className="space-y-12">
      {menu.map((fam) => (
        <section key={fam.family} aria-label={t(`serviceFamily.${fam.family}`)}>
          <h3 className="mb-5 text-xl font-bold tracking-tight">
            {t(`serviceFamily.${fam.family}`)}
          </h3>

          {/* Bloc défilable horizontalement (scroll-snap), pleine largeur. */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:-mx-6 sm:px-6">
            {fam.items.map((item) => {
              const Icon = item.icon;
              const img = images[item.slug];
              const desc = descriptions[item.slug];
              const label = t(`serviceItems.${item.labelKey}`);
              return (
                <Link
                  key={item.labelKey}
                  href={`/services/${item.slug}`}
                  className="group flex w-72 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition hover:shadow-lg hover:ring-brand/30 sm:w-80"
                >
                  {/* Photo mise en avant (ou dégradé de repli avec icône). */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-accent">
                    {img ? (
                      // URL Sanity déjà optimisée → <img> natif.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={label}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand/15 to-accent text-brand">
                        <Icon className="size-14" />
                      </div>
                    )}
                    {/* Pastille icône (repère discret, l'image reste en avant). */}
                    <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-lg bg-background/90 text-brand shadow-sm">
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h4 className="font-semibold">{label}</h4>
                    {desc ? (
                      <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">
                        {desc}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                      {cta}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
