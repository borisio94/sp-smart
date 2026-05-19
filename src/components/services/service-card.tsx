import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { DynamicIcon } from "@/components/dynamic-icon";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceCardData } from "../../../sanity/lib/types";

/**
 * Carte d'un service (grilles accueil & page services).
 */
export function ServiceCard({
  service,
  locale,
  cta,
}: {
  service: ServiceCardData;
  locale: string;
  cta: string;
}) {
  const title = pickLocale(service.title, locale);
  const desc = pickLocale(service.shortDescription, locale);

  return (
    <Card className="group h-full transition-shadow hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-brand">
          <DynamicIcon name={service.icon} className="size-6" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{desc}</p>
        <Link
          href={`/services/${service.slug ?? ""}`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand"
        >
          {cta}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
