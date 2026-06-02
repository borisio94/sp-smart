import { formatDate } from "@/lib/billing/format";
import type { BillingDocument } from "@/lib/billing/types";

/** Libellés des étapes (passés traduits par le parent Server Component). */
export interface TimelineLabels {
  created: string;
  sent: string;
  confirmed: string;
  completed: string;
  cancelled: string;
}

/**
 * Frise des dates clés du document (émission, envoi, confirmation,
 * complétion, annulation). N'affiche que les étapes datées.
 */
export function StatusTimeline({
  document: doc,
  labels,
}: {
  document: BillingDocument;
  labels: TimelineLabels;
}) {
  const steps: { key: keyof TimelineLabels; date: string | null }[] = [
    { key: "created", date: doc.created_at },
    { key: "sent", date: doc.sent_at },
    { key: "confirmed", date: doc.confirmed_at },
    { key: "completed", date: doc.completed_at },
    { key: "cancelled", date: doc.cancelled_at },
  ];
  const dated = steps.filter((s) => s.date);

  if (dated.length === 0) return null;

  return (
    <ul className="space-y-2 text-sm">
      {dated.map((s) => (
        <li key={s.key} className="flex items-center gap-3">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="text-muted-foreground">{labels[s.key]}</span>
          <span className="ml-auto tabular-nums">{formatDate(s.date)}</span>
        </li>
      ))}
    </ul>
  );
}
