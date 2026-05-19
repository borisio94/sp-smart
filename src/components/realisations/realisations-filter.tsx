"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { RealisationCard } from "./realisation-card";
import type { RealisationCard as RealisationCardData } from "../../../sanity/lib/types";

type ServiceOption = { id: string; label: string };

/**
 * Portfolio filtrable par service (filtrage côté client).
 */
export function RealisationsFilter({
  items,
  services,
  locale,
}: {
  items: RealisationCardData[];
  services: ServiceOption[];
  locale: string;
}) {
  const t = useTranslations("Nav");
  const [active, setActive] = useState<string>("all");

  const filtered =
    active === "all"
      ? items
      : items.filter((i) => i.serviceId === active);

  const btn = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActive(id)}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active === id
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border hover:bg-accent",
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {btn("all", t("allServices"))}
        {services.map((s) => btn(s.id, s.label))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <RealisationCard key={item._id} item={item} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted-foreground">—</p>
      )}
    </div>
  );
}
