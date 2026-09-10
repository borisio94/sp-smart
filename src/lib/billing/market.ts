/**
 * Économie d'un marché : ce qu'il rapporte, ce qu'il coûte, ce qu'on peut
 * réellement déposer en caisse.
 *
 * Trois niveaux de lecture, volontairement distincts (cf. migration 0021) :
 *
 *  1. TRAVAUX — le chantier vendu par le devis : `marketTotal − worksExpenses`.
 *     C'est la rentabilité du marché d'origine, et elle doit le rester : si une
 *     réparation sous garantie venait s'y imputer, plus personne ne saurait si
 *     le chantier avait été bien vendu.
 *
 *  2. APRÈS-VENTE — les interventions postérieures :
 *     `afterSalesCollected − afterSalesExpenses`. Une panne peut rapporter
 *     (intervention facturée) comme coûter (garantie), d'où un résultat qui
 *     s'affiche dans les deux sens.
 *
 *  3. CUMUL — ce que le marché aura rapporté en tout, sur toute sa vie.
 *
 * Le DISPONIBLE ignore cette distinction : l'argent en caisse est le même,
 * qu'il vienne du chantier ou d'une réparation. C'est lui — jamais la marge —
 * qui plafonne un versement, car la marge d'un marché à moitié réglé n'existe
 * pas encore en trésorerie.
 *
 * Module volontairement « pur » (aucun import Node, aucune requête) : il est
 * partagé par la fiche admin et les actions serveur, et reste testable seul.
 * La lecture en base vit dans `queries.ts` (`getMarketOverview`).
 */

import type {
  DocumentType,
  MarketExpense,
  MarketOverview,
  MarketPayout,
} from "./types";

/**
 * Types de documents qui portent un marché. Une facture n'en est qu'une part
 * (acompte) : c'est la cotation qui fait foi du montant total, donc elle seule
 * porte les charges et le contrat de maintenance.
 */
export const MARKET_DOCUMENT_TYPES: DocumentType[] = [
  "devis",
  "proforma",
  "bon_commande",
];

/** Un document peut-il porter des charges de marché ? */
export function isMarketDocument(type: DocumentType): boolean {
  return MARKET_DOCUMENT_TYPES.includes(type);
}

export interface MarketOverviewInput {
  /** Montant total de la cotation. */
  marketTotal: number;
  /** Encaissé du client au titre des travaux (cotation + factures « travaux »). */
  worksCollected: number;
  /** Encaissé du client au titre des interventions après-vente. */
  afterSalesCollected: number;
  /** Nombre de factures d'intervention émises sur ce marché. */
  afterSalesCount: number;
  /** Charges saisies, toutes phases confondues, de la plus récente à la plus ancienne. */
  expenses: MarketExpense[];
  /** Versements déjà effectués vers la caisse. */
  payouts: MarketPayout[];
}

/** Somme d'une liste de montants, tolérante aux valeurs non numériques. */
function sum(values: number[]): number {
  return values.reduce((total, v) => total + (Number(v) || 0), 0);
}

/** Assemble la synthèse financière d'un marché. */
export function buildMarketOverview({
  marketTotal,
  worksCollected,
  afterSalesCollected,
  afterSalesCount,
  expenses,
  payouts,
}: MarketOverviewInput): MarketOverview {
  const total = Number(marketTotal) || 0;
  const collectedWorks = Number(worksCollected) || 0;
  const collectedAfterSales = Number(afterSalesCollected) || 0;

  const worksExpenses = sum(
    expenses.filter((e) => e.phase !== "panne").map((e) => e.amount),
  );
  const afterSalesExpenses = sum(
    expenses.filter((e) => e.phase === "panne").map((e) => e.amount),
  );

  const expensesTotal = worksExpenses + afterSalesExpenses;
  const collectedTotal = collectedWorks + collectedAfterSales;
  const paidOut = sum(payouts.map((p) => p.amount));

  const worksMargin = total - worksExpenses;
  const afterSalesResult = collectedAfterSales - afterSalesExpenses;

  // `available` garde son signe : négatif, il signale que les charges ont
  // dépassé l'argent reçu — l'entreprise avance la trésorerie du chantier.
  const available = collectedTotal - expensesTotal;

  return {
    marketTotal: total,
    worksCollected: collectedWorks,
    worksExpenses,
    worksMargin,

    afterSalesCollected: collectedAfterSales,
    afterSalesExpenses,
    afterSalesResult,
    afterSalesCount,

    totalMargin: worksMargin + afterSalesResult,
    collectedTotal,
    expensesTotal,
    available,
    paidOut,
    // Un plafond ne peut pas être négatif : on ne « doit » jamais reverser.
    remainingToPayOut: Math.max(0, available - paidOut),

    expenses,
    payouts,
  };
}

/** Le marché a-t-il une vie après-vente (charge de panne ou facture d'intervention) ? */
export function hasAfterSales(overview: MarketOverview): boolean {
  return (
    overview.afterSalesCount > 0 ||
    overview.afterSalesExpenses > 0 ||
    overview.afterSalesCollected > 0
  );
}

/** Verdict d'un versement projeté vers la caisse. */
export interface PayoutCheck {
  /** Le versement tient dans le disponible. */
  withinAvailable: boolean;
  /** Ce qui resterait à verser après l'opération (peut être négatif). */
  projectedRemaining: number;
}

/**
 * Contrôle un versement avant enregistrement. Le dépassement n'est pas une
 * erreur bloquante — l'utilisateur peut avoir une raison légitime (avance de
 * fonds, correction) — mais il exige une confirmation explicite, comme le
 * franchissement de la ligne rouge en caisse.
 */
export function checkPayout(
  amount: number,
  overview: MarketOverview,
): PayoutCheck {
  const value = Number(amount) || 0;
  return {
    withinAvailable: value <= overview.remainingToPayOut,
    projectedRemaining: overview.remainingToPayOut - value,
  };
}
