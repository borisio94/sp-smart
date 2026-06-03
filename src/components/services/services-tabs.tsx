"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { buildServiceMenu } from "@/components/layout/header/service-menu";

/**
 * Services affichés en onglets PAR FAMILLE (même énumération que le menu de
 * navigation, via la taxonomie curatée `service-menu`). Chaque onglet est une
 * famille ; le panneau liste ses sous-branches en cartes.
 * Reçoit la liste des slugs réellement publiés (anti-404) et un dictionnaire
 * de descriptions (slug → texte localisé) calculé côté serveur.
 */
export function ServicesTabs({
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
  const [active, setActive] = useState(0);

  if (menu.length === 0) return null;
  const current = menu[active] ?? menu[0];

  return (
    <div>
      {/* Onglets = familles de services */}
      <div
        role="tablist"
        aria-label={t("services")}
        className="flex gap-2 overflow-x-auto border-b border-border pb-px"
      >
        {menu.map((fam, i) => {
          const selected = i === active;
          return (
            <button
              key={fam.family}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {t(`serviceFamily.${fam.family}`)}
            </button>
          );
        })}
      </div>

      {/* Panneau : sous-branches de la famille en cartes */}
      <div
        role="tabpanel"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {current.items.map((item) => {
          const Icon = item.icon;
          const desc = descriptions[item.slug];
          const img = images[item.slug];
          const label = t(`serviceItems.${item.labelKey}`);
          return (
            <Link
              key={item.labelKey}
              href={`/services/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition hover:shadow-lg hover:ring-brand/30"
            >
              {/* Image illustrative (ou dégradé de repli avec icône) */}
              <div className="relative aspect-[3/2] overflow-hidden bg-accent">
                {img ? (
                  // Image Sanity pré-résolue (URL). <img> car URL déjà optimisée.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={label}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand/15 to-accent text-brand">
                    <Icon className="size-12" />
                  </div>
                )}
                {/* Pastille icône en surimpression */}
                <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-lg bg-background/90 text-brand shadow-sm">
                  <Icon className="size-5" />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold">{label}</h3>
                {desc ? (
                  <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{desc}</p>
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
    </div>
  );
}
