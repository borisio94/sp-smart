import { cn } from "@/lib/utils";

import { Eyebrow, Heading, Lead } from "./typography";

type Props = {
  eyebrow?: string;
  title: string;
  lead?: string;
  centered?: boolean;
  className?: string;
};

/**
 * En-tête de section : sur-titre + titre + accroche.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  centered = true,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-12",
        centered && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading level={2} className={cn(eyebrow && "mt-2")}>
        {title}
      </Heading>
      {lead && <Lead className={cn(centered && "mx-auto")}>{lead}</Lead>}
    </div>
  );
}
