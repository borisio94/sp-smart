import type { DocumentStatus, DocumentType, Payment, PaymentStatus } from "./types";

/**
 * Indique si un document peut recevoir un paiement.
 * - Une facture est payable quel que soit son statut (comportement historique).
 * - Tout autre document devient payable dès qu'il est « confirmé » ou « terminé »
 *   (ex. acompte encaissé sur un devis confirmé avant émission de la facture).
 * - Un reçu n'est jamais payable (il constate déjà un règlement).
 * - Un rapport de maintenance n'est jamais payable (document technique).
 */
export function canReceivePayment(
  type: DocumentType,
  status: DocumentStatus,
): boolean {
  if (type === "recu" || type === "rapport_maintenance") return false;
  if (type === "facture") return true;
  return status === "confirme" || status === "termine";
}

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
