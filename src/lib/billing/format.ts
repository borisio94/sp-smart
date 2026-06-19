import type {
  DocumentType,
  DocumentStatus,
  PaymentStatus,
  ClientType,
  PaymentMethod,
} from "./types";

/**
 * Helpers de formatage du module Billing.
 * Devise toujours en FCFA (jamais XAF/€), nombres au format fr-FR.
 */

const numberFmt = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

/** Formate un montant entier en « 1 250 000 FCFA ». */
export function formatMoney(amount: number | null | undefined): string {
  return `${numberFmt.format(Math.round(amount ?? 0))} FCFA`;
}

/** Formate un nombre (quantités) au format fr-FR. */
export function formatNumber(value: number | null | undefined): string {
  return numberFmt.format(value ?? 0);
}

/** Formate une date ISO en « 01/06/2026 ». */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Libellé lisible d'un type de document. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  devis: "Devis",
  proforma: "Facture proforma",
  bon_commande: "Bon de commande",
  facture: "Facture",
  recu: "Reçu de paiement",
  rapport_maintenance: "Rapport de maintenance",
  autre: "Autre",
};

/** Types STANDARDS proposés dans le sélecteur (hors « autre », réservé aux types perso). */
export const DOCUMENT_TYPES: DocumentType[] = [
  "devis",
  "proforma",
  "bon_commande",
  "facture",
  "recu",
  "rapport_maintenance",
];

/**
 * Libellé affichable d'un document : nom du type personnalisé s'il existe,
 * sinon le libellé du type standard. À utiliser partout où l'on affichait
 * `DOCUMENT_TYPE_LABELS[doc.type]` pour une entité qui porte `custom_type`.
 */
export function documentTypeLabel(doc: {
  type: DocumentType;
  custom_type?: { name: string | null } | null;
}): string {
  const custom = doc.custom_type?.name?.trim();
  return custom && custom.length > 0 ? custom : DOCUMENT_TYPE_LABELS[doc.type];
}

/** Libellé lisible d'un statut de document. */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  confirme: "Confirmé",
  termine: "Terminé",
  annule: "Annulé",
};

/** Libellé lisible d'un statut de paiement. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  non_paye: "Non payé",
  acompte: "Acompte",
  partiel: "Partiel",
  paye_total: "Payé",
  rembourse: "Remboursé",
};

/** Libellé lisible d'un type de client. */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  institution: "Institution",
};

/** Libellé lisible d'un moyen de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  especes: "Espèces",
  momo_mtn: "MoMo MTN",
  momo_orange: "Orange Money",
  virement: "Virement",
  cheque: "Chèque",
  carte: "Carte bancaire",
};
