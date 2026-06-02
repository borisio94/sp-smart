"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/dynamic-icon";
import type { ServiceCardData } from "../../../sanity/lib/types";

/**
 * Affichage des services sous forme d'onglets : une barre d'onglets (icône +
 * titre) et un panneau détaillant le service sélectionné. Améliore le visuel
 * par rapport à une simple grille de cartes.
 */
export function ServicesTabs({
  services,
  locale,
  cta,
}: {
  services: ServiceCardData[];
  locale: string;
  cta: string;
}) {
  const [active, setActive] = useState(0);
  const current = services[active] ?? services[0];

  return (
    <div>
      {/* Barre d'onglets (défilable horizontalement sur mobile) */}
      <div
        role="tablist"
        aria-label="Services"
        className="flex gap-2 overflow-x-auto border-b border-border pb-px"
      >
        {services.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s._id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <DynamicIcon name={s.icon} className="size-4" />
              {pickLocale(s.title, locale)}
            </button>
          );
        })}
      </div>

      {/* Panneau du service sélectionné */}
      {current ? (
        <div
          role="tabpanel"
          className="mt-8 grid items-center gap-8 rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8 lg:grid-cols-[auto_1fr]"
        >
          <div className="flex size-20 items-center justify-center rounded-xl bg-accent text-brand">
            <DynamicIcon name={current.icon} className="size-10" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">
              {pickLocale(current.title, locale)}
            </h3>
            <p className="mt-3 text-muted-foreground">
              {pickLocale(current.shortDescription, locale)}
            </p>
            <Link
              href={`/services/${current.slug ?? ""}`}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              {cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
