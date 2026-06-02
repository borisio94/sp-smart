import { Badge } from "@/components/ui/badge";
import {
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/billing/format";
import type { DocumentStatus, PaymentStatus } from "@/lib/billing/types";

const STATUS_TONE: Record<
  DocumentStatus,
  "neutral" | "info" | "success" | "warning" | "danger"
> = {
  brouillon: "neutral",
  envoye: "info",
  confirme: "warning",
  termine: "success",
  annule: "danger",
};

const PAYMENT_TONE: Record<
  PaymentStatus,
  "neutral" | "info" | "success" | "warning" | "danger"
> = {
  non_paye: "danger",
  acompte: "warning",
  partiel: "warning",
  paye_total: "success",
  rembourse: "neutral",
};

/** Badge coloré du statut de document. */
export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{DOCUMENT_STATUS_LABELS[status]}</Badge>;
}

/** Badge coloré du statut de paiement. */
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
