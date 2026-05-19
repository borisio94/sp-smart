import { MapPin } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { SanityImage } from "@/components/sanity-image";
import { Card, CardContent } from "@/components/ui/card";
import type { RealisationCard as RealisationCardData } from "../../../sanity/lib/types";

/**
 * Carte d'une réalisation (portfolio).
 */
export function RealisationCard({
  item,
  locale,
}: {
  item: RealisationCardData;
  locale: string;
}) {
  const title = pickLocale(item.title, locale);
  const service = pickLocale(item.serviceTitle, locale);

  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/realisations/${item.slug ?? ""}`}>
        {item.cover?.asset?._ref && (
          <SanityImage
            image={item.cover}
            alt={title}
            width={600}
            height={400}
            className="h-52 w-full object-cover"
          />
        )}
        <CardContent className="p-5">
          {service && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {service}
            </p>
          )}
          <h3 className="mt-1 text-lg font-semibold group-hover:text-brand">
            {title}
          </h3>
          {item.location && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {item.location}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
