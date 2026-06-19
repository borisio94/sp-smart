import type { DocumentType } from "../types";

/**
 * Palette et constantes visuelles du PDF (design validé V1+V3).
 * Couleurs en hexadécimal (react-pdf ne gère pas oklch).
 */
export const PDF_COLORS = {
  corporate: "#0f3a8c", // bleu corporate
  corporateLight: "#5b9bd5", // bleu clair (filet d'en-tête)
  navy: "#0a2a6b", // bleu nuit (bon de commande)
  green: "#15803d", // vert (reçu)
  teal: "#0f766e", // sarcelle (rapport de maintenance)
  redDiscount: "#b91c1c", // rouge remise
  footerBg: "#f1f5f9", // gris pied de page
  gray475: "#475569",
  gray64: "#64748b",
  gray94: "#94a3b8",
  text: "#1a2332", // texte principal
  bodyBlack: "#1a2332", // texte des lignes du tableau (noir, pas bleu)
  totalGreen: "#15803d", // bandeau Total TTC (vert, conforme à la maquette)
  tableAltRow: "#eef3fb", // bleu très clair (lignes alternées)
  bandBg: "#dbe6f5", // fond clair du bandeau titre (DEVIS / numéro)
  white: "#ffffff",
  hairline: "#cbd5e1",
} as const;

/** Couleur du bandeau-titre selon le type de document. */
export function bandColor(type: DocumentType): string {
  if (type === "bon_commande") return PDF_COLORS.navy;
  if (type === "recu") return PDF_COLORS.green;
  if (type === "rapport_maintenance") return PDF_COLORS.teal;
  return PDF_COLORS.corporate; // devis, proforma, facture
}

/**
 * Formatage des nombres pour le PDF.
 * Intl.NumberFormat('fr-FR') insère une espace fine insécable ( ) comme
 * séparateur de milliers. La police Helvetica intégrée à react-pdf NE possède
 * PAS ce glyphe (ni  ) → elle affiche un caractère de substitution ("/").
 * On remplace donc tous ces séparateurs par une espace normale ( ),
 * parfaitement rendue : "68 000".
 */
const numberFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function normalizeSpaces(s: string): string {
  // Remplace espace fine insécable, espace insécable et espace fine par " ".
  return s.replace(/[   ]/g, " ");
}

export function pdfMoney(amount: number | null | undefined): string {
  return `${normalizeSpaces(numberFmt.format(Math.round(amount ?? 0)))} FCFA`;
}

export function pdfNumber(value: number | null | undefined): string {
  return normalizeSpaces(numberFmt.format(value ?? 0));
}

/**
 * Nettoie une valeur de champ de l'organisation pour l'affichage sur le PDF :
 * renvoie null si la valeur est vide OU contient le placeholder "A_REMPLIR"
 * (jamais montré à un client). À utiliser pour tous les champs légaux/contact.
 */
export function cleanField(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (v === "" || v.toUpperCase() === "A_REMPLIR") return null;
  return v;
}

/** Retire le protocole d'une URL pour l'affichage (évite l'auto-lien bleu). */
export function displayUrl(value: string | null | undefined): string | null {
  const v = cleanField(value);
  if (!v) return null;
  return v.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function pdfDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
