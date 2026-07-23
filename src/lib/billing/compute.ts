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

/** Forme minimale d'une ligne pour le calcul de son total. */
export interface LineLike {
  quantity: number;
  unit_price: number;
  is_amount_only?: boolean | null;
}

/**
 * Total effectif d'une ligne : montant direct si forfaitaire (unit_price),
 * sinon quantité × prix unitaire.
 */
export function resolveLineTotal(line: LineLike): number {
  return line.is_amount_only
    ? Math.round(Number(line.unit_price) || 0)
    : lineTotal(line.quantity, line.unit_price);
}

/** Ligne minimale pour le regroupement en sections. */
export interface SectionLineLike extends LineLike {
  section?: string | null;
  line_total?: number;
}

/** Section (compartiment) d'un document : intitulé, lignes et sous-total. */
export interface DocumentSectionGroup<T extends SectionLineLike> {
  title: string;
  lines: T[];
  subtotal: number;
}

/**
 * Regroupe des lignes en sections consécutives (même intitulé). Le sous-total
 * utilise `line_total` s'il est fourni (lecture BD), sinon il est recalculé.
 */
export function groupSections<T extends SectionLineLike>(
  lines: T[],
): DocumentSectionGroup<T>[] {
  const groups: DocumentSectionGroup<T>[] = [];
  for (const line of lines) {
    const title = (line.section ?? "").trim();
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      last.lines.push(line);
    } else {
      groups.push({ title, lines: [line], subtotal: 0 });
    }
  }
  for (const group of groups) {
    group.subtotal = group.lines.reduce(
      (sum, l) =>
        sum + (typeof l.line_total === "number" ? l.line_total : resolveLineTotal(l)),
      0,
    );
  }
  return groups;
}

/** Indique si un jeu de lignes utilise au moins une section nommée. */
export function hasNamedSections(
  lines: { section?: string | null }[],
): boolean {
  return lines.some((l) => (l.section ?? "").trim() !== "");
}

/** Somme (entière, positive) des acomptes déduits d'une facture définitive. */
export function deductionsTotal(
  deductions: { amount: number }[] | null | undefined,
): number {
  return (deductions ?? []).reduce(
    (sum, d) => sum + Math.max(0, Math.round(Number(d.amount) || 0)),
    0,
  );
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
      ? input.lines.reduce((sum, l) => sum + resolveLineTotal(l), 0)
      : 0;

  const laborAmount = Math.round(Number(input.labor_amount) || 0);
  const discountAmount = Math.round(Number(input.discount_amount) || 0);
  const taxRate = Number(input.tax_rate) || 0;

  const base = Math.max(0, materialsSubtotal + laborAmount - discountAmount);
  const taxAmount = Math.round((base * taxRate) / 100);
  const totalAmount = base + taxAmount;

  return { materialsSubtotal, laborAmount, discountAmount, taxRate, taxAmount, totalAmount };
}
