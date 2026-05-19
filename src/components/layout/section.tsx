import { cn } from "@/lib/utils";

import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** Variante de fond : par défaut, atténué, ou bleu nuit (marque). */
  tone?: "default" | "muted" | "navy";
  /** Désactive le conteneur centré interne. */
  bleed?: boolean;
};

const TONES: Record<NonNullable<SectionProps["tone"]>, string> = {
  default: "bg-background text-foreground",
  muted: "bg-muted text-foreground",
  navy: "bg-brand-navy text-white",
};

/**
 * Section de page avec espacement vertical et fond cohérents.
 */
export function Section({
  className,
  tone = "default",
  bleed = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("py-16 sm:py-20 lg:py-24", TONES[tone], className)}
      {...props}
    >
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}
