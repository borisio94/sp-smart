import type { BillingDocument } from "../types";

/**
 * Nom de fichier PDF : [type]-[numéro]-[client].pdf, en minuscules,
 * sans accents ni caractères spéciaux (compatible tous OS).
 */
export function pdfFilename(
  document: Pick<BillingDocument, "type" | "number">,
  clientName: string | null,
): string {
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // supprime les accents
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  const parts = [
    document.type,
    document.number ? slug(document.number) : "document",
    clientName ? slug(clientName) : null,
  ].filter(Boolean);

  return `${parts.join("-")}.pdf`;
}
