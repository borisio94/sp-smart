import type { Payment, PaymentStatus } from "./types";

/**
 * Logique de paiement (source de vérité partagée client/serveur).
 * Règles de calcul du statut (cf. BILLING_BRIEF.md) :
 *   - somme = 0                         → non_paye
 *   - 0 < somme < total × 0,5           → acompte
 *   - total × 0,5 ≤ somme < total       → partiel
 *   - somme ≥ total                     → paye_total
 *   - présence d'un paiement négatif    → rembourse
 */

/** Somme des montants de paiement (les remboursements sont négatifs). */
export function sumPayments(payments: Pick<Payment, "amount">[]): number {
  return payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
}

/** Calcule le statut de paiement à partir des paiements et du total dû. */
export function computePaymentStatus(
  payments: Pick<Payment, "amount">[],
  totalAmount: number,
): PaymentStatus {
  const hasRefund = payments.some((p) => (Number(p.amount) || 0) < 0);
  if (hasRefund) return "rembourse";

  const paid = sumPayments(payments);
  if (paid <= 0) return "non_paye";

  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    // Total nul mais paiement reçu → considéré comme payé.
    return "paye_total";
  }
  if (paid >= total) return "paye_total";
  if (paid >= total * 0.5) return "partiel";
  return "acompte";
}

/** Montant restant à payer (jamais négatif). */
export function remainingAmount(
  payments: Pick<Payment, "amount">[],
  totalAmount: number,
): number {
  return Math.max(0, (Number(totalAmount) || 0) - sumPayments(payments));
}
