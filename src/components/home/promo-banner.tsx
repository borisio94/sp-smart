import { Megaphone } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { Container } from "@/components/layout/container";
import type { PromotionBanner } from "../../../sanity/lib/types";

/**
 * Bandeau des promotions actives (haut de l'accueil).
 */
export function PromoBanner({
  promotions,
  locale,
}: {
  promotions: PromotionBanner[];
  locale: string;
}) {
  if (!promotions || promotions.length === 0) return null;

  return (
    <div className="bg-brand text-brand-foreground">
      <Container className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-3 text-center text-sm">
        <Megaphone className="size-4 shrink-0" />
        {promotions.map((p) => (
          <Link
            key={p._id}
            href="/promotions"
            className="font-medium hover:underline"
          >
            {pickLocale(p.title, locale)}
            {p.promoCode && (
              <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs">
                {p.promoCode}
              </span>
            )}
          </Link>
        ))}
      </Container>
    </div>
  );
}
