/**
 * Suivi financier du « marché » : le devis (ou la proforma) auquel une facture
 * est rattachée, et tout ce qui a été facturé puis encaissé dessus.
 *
 * Une facture d'acompte ne porte que sa propre part (ex. 780 000 sur un marché
 * de 1 300 000) : sans ce recoupement, ni le client ni l'émetteur ne voient ce
 * qui reste dû sur l'ensemble. C'est cette lacune que ce module comble.
 *
 * Module volontairement « pur » (aucun import Node) : il est partagé par le
 * PDF, la fiche admin et la page publique. La lecture en base vit dans
 * `settlement-query.ts`, et la page du lien privé obtient les mêmes agrégats
 * par la RPC `get_document_by_token` (cf. migration 0018).
 */

export interface Settlement {
  /**
   * Cotation de rattachement (devis, proforma, bon de commande). null côté
   * page publique : la RPC n'expose que le numéro, jamais l'identifiant.
   */
  quotationId: string | null;
  quotationNumber: string | null;
  /** Montant total du marché = total de la cotation. */
  marketTotal: number;
  /** Somme des factures émises sur ce marché (hors annulées). */
  invoicedTotal: number;
  /** Somme réellement encaissée sur ces factures. */
  settledTotal: number;
  /** Reste à payer sur le marché = marché − encaissé (jamais négatif). */
  remaining: number;
}

/**
 * Part qu'un montant représente dans le marché (ex. « 60 % »), arrondie à
 * l'entier. Renvoie null si le marché est nul : on n'affiche alors aucun taux.
 */
export function marketShare(
  amount: number,
  marketTotal: number,
): number | null {
  if (!marketTotal || marketTotal <= 0) return null;
  return Math.round((amount / marketTotal) * 100);
}

/**
 * Assemble un `Settlement` à partir de montants déjà lus (base ou RPC).
 * Renvoie null quand il n'y a pas de marché à recouper.
 */
export function buildSettlement(input: {
  quotationId?: string | null;
  quotationNumber: string | null;
  marketTotal: number | null | undefined;
  invoicedTotal: number | null | undefined;
  settledTotal: number | null | undefined;
}): Settlement | null {
  const marketTotal = Number(input.marketTotal) || 0;
  // Aucun marché rattaché — ou RPC pas encore migrée (champs absents).
  if (marketTotal <= 0) return null;

  const settledTotal = Number(input.settledTotal) || 0;
  return {
    quotationId: input.quotationId ?? null,
    quotationNumber: input.quotationNumber,
    marketTotal,
    invoicedTotal: Number(input.invoicedTotal) || 0,
    settledTotal,
    remaining: Math.max(0, marketTotal - settledTotal),
  };
}
