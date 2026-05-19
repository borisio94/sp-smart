import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { SanityImage } from "@/components/sanity-image";
import type { Partner } from "../../../sanity/lib/types";

/**
 * Bandeau des logos partenaires / marques.
 */
export function PartnersStrip({
  partners,
  title,
}: {
  partners: Partner[];
  title: string;
}) {
  if (!partners || partners.length === 0) return null;

  return (
    <Section tone="muted">
      <SectionHeader title={title} />
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
        {partners.map((p) => {
          const logo = (
            <SanityImage
              image={p.logo}
              alt={p.name ?? ""}
              width={160}
              height={64}
              className="h-12 w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          );
          return p.url ? (
            <a
              key={p._id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
            >
              {logo}
            </a>
          ) : (
            <div key={p._id}>{logo}</div>
          );
        })}
      </div>
    </Section>
  );
}
