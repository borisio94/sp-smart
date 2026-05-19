import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { DynamicIcon } from "@/components/dynamic-icon";
import type { HomePage } from "../../../sanity/lib/types";

/**
 * Section « Pourquoi nous » : liste d'atouts avec icônes.
 */
export function WhyUs({
  data,
  locale,
}: {
  data: HomePage;
  locale: string;
}) {
  const items = data?.whyItems ?? [];
  if (items.length === 0) return null;

  return (
    <Section tone="muted">
      <SectionHeader title={pickLocale(data?.whyTitle, locale, "Pourquoi nous")} />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg bg-background p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-brand">
              <DynamicIcon name={item.icon} className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {pickLocale(item.title, locale)}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {pickLocale(item.description, locale)}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
