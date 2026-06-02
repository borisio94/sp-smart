import type { DocumentInput } from "./validation";

/**
 * Calculs financiers d'un document (source de vérité partagée client/serveur).
 * Tous les montants sont des entiers FCFA.
 */
export interface DocumentTotals {
  materialsSubtotal: number;
  laborAmount: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

/** Total d'une ligne = quantité × prix unitaire (arrondi à l'entier). */
export function lineTotal(quantity: number, unitPrice: number): number {
  return Math.round((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/**
 * Calcule les totaux d'un document.
 * En mode « texte », le sous-total matériel est 0 (pas de tableau de lignes).
 * La taxe (IR…) s'applique sur la base HT = matériel + main d'œuvre − remise.
 * Total TTC = base HT + taxe.
 */
export function computeTotals(
  input: Pick<
    DocumentInput,
    "body_mode" | "lines" | "labor_amount" | "discount_amount" | "tax_rate"
  >,
): DocumentTotals {
  const materialsSubtotal =
    input.body_mode === "table"
      ? input.lines.reduce(
          (sum, l) => sum + lineTotal(l.quantity, l.unit_price),
          0,
        )
      : 0;

  const laborAmount = Math.round(Number(input.labor_amount) || 0);
  const discountAmount = Math.round(Number(input.discount_amount) || 0);
  const taxRate = Number(input.tax_rate) || 0;

  const base = Math.max(0, materialsSubtotal + laborAmount - discountAmount);
  const taxAmount = Math.round((base * taxRate) / 100);
  const totalAmount = base + taxAmount;

  return { materialsSubtotal, laborAmount, discountAmount, taxRate, taxAmount, totalAmount };
}
