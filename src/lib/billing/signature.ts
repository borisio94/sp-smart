import type { DocumentType } from "./types";

/**
 * Règles partagées de la signature électronique du client.
 * Module volontairement « pur » (aucun import Node) : il est utilisé aussi bien
 * par les formulaires client que par le route handler serveur.
 */

/**
 * Types de documents que le client peut signer depuis son lien privé.
 * Le rapport de maintenance est exclu : il est signé sur site, pas en ligne.
 */
export function isSignableType(type: DocumentType | string): boolean {
  return type !== "rapport_maintenance";
}

/** Taille maximale acceptée pour le PNG du tracé (data URL brute). */
export const MAX_SIGNATURE_DATA_URL = 400_000; // ~300 Ko de PNG après base64

/** Lignes prises en compte dans l'empreinte du document signé. */
export interface SignedContentLine {
  position: number;
  designation: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/** Champs du document figés par la signature. */
export interface SignedContent {
  number: string | null;
  issue_date: string;
  client_name: string | null;
  body_mode: string;
  body_text: string | null;
  total_amount: number;
  payment_terms: string | null;
  delivery_terms: string | null;
  lines: SignedContentLine[];
}

/**
 * Représentation canonique du contenu signé : c'est cette chaîne qui est
 * hachée (SHA-256) au moment de la signature. Toute modification ultérieure
 * du document (montant, ligne, conditions…) produit une empreinte différente
 * et rend donc la falsification détectable.
 *
 * L'ordre des champs est figé ici : ne jamais le réarranger, sous peine
 * d'invalider les empreintes déjà enregistrées.
 */
export function canonicalSignedContent(content: SignedContent): string {
  const lines = [...content.lines]
    .sort((a, b) => a.position - b.position)
    .map((l) =>
      [
        l.position,
        l.designation.trim(),
        l.quantity,
        l.unit_price,
        l.line_total,
      ].join("|"),
    );

  return [
    `number=${content.number ?? ""}`,
    `issue_date=${content.issue_date}`,
    `client=${content.client_name ?? ""}`,
    `body_mode=${content.body_mode}`,
    `body_text=${(content.body_text ?? "").trim()}`,
    `total=${content.total_amount}`,
    `payment_terms=${(content.payment_terms ?? "").trim()}`,
    `delivery_terms=${(content.delivery_terms ?? "").trim()}`,
    `lines=${lines.join(";")}`,
  ].join("\n");
}

/** Référence courte affichée sur le document (8 premiers caractères du hash). */
export function shortHash(hash: string | null | undefined): string {
  return (hash ?? "").slice(0, 8).toUpperCase();
}
