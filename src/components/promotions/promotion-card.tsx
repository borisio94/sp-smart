import { CalendarClock, Tag } from "lucide-react";

import { pickLocale } from "@/lib/locale";
import { SanityImage } from "@/components/sanity-image";
import { Card, CardContent } from "@/components/ui/card";
import type { PromotionFull } from "../../../sanity/lib/types";

/**
 * Carte d'une promotion active.
 */
export function PromotionCard({
  promo,
  locale,
}: {
  promo: PromotionFull;
  locale: string;
}) {
  const title = pickLocale(promo.title, locale);
  const desc = pickLocale(promo.description, locale);

  const discount =
    promo.discountValue != null
      ? promo.discountType === "amount"
        ? `-${promo.discountValue} FCFA`
        : `-${promo.discountValue}%`
      : null;

  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")
      : "";

  return (
    <Card className="relative h-full overflow-hidden">
      {discount && (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-brand px-3 py-1 text-sm font-bold text-brand-foreground">
          {discount}
        </span>
      )}
      {promo.image?.asset?._ref && (
        <SanityImage
          image={promo.image}
          alt={title}
          width={600}
          height={320}
          className="h-44 w-full object-cover"
        />
      )}
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {desc && (
          <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        )}

        {promo.services && promo.services.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {promo.services
              .map((s) => pickLocale(s.title, locale))
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          {promo.promoCode && (
            <span className="inline-flex items-center gap-1 rounded border border-dashed border-brand px-2 py-1 font-mono font-semibold text-brand">
              <Tag className="size-4" />
              {promo.promoCode}
            </span>
          )}
          {promo.endDate && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <CalendarClock className="size-4" />
              {fmt(promo.startDate)} → {fmt(promo.endDate)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
