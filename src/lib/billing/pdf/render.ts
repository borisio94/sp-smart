import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { DocumentPDF } from "./DocumentPDF";
import { ReportPDF } from "./ReportPDF";
import { fetchBrandingDataUri, fetchClientSignatureDataUri } from "./branding";
import { fetchSiteLogoDataUri } from "./site-logo";
import type {
  BillingDocument,
  DocumentLine,
  Organization,
  Client,
} from "../types";

export interface RenderDocumentPdfInput {
  document: BillingDocument;
  lines: DocumentLine[];
  organization: Organization;
  client: Client | null;
  categoryName?: string | null;
  customTypeName?: string | null;
}

/**
 * Rend le PDF d'un document : charge l'identité visuelle (logo, signature et
 * cachet de l'entreprise, tracé signé par le client) puis choisit la mise en
 * page — dédiée pour le rapport de maintenance, commerciale pour le reste.
 *
 * Unique point d'entrée du rendu : partagé par le PDF admin, le PDF du lien
 * privé et la pièce jointe envoyée après signature, pour que les trois
 * produisent rigoureusement le même fichier.
 */
export async function renderDocumentPdf({
  document,
  lines,
  organization,
  client,
  categoryName = null,
  customTypeName = null,
}: RenderDocumentPdfInput): Promise<Buffer> {
  const [uploadedLogo, signatureData, stampData, clientSignatureData] =
    await Promise.all([
      fetchBrandingDataUri(organization.logo_url),
      fetchBrandingDataUri(organization.signature_url),
      fetchBrandingDataUri(organization.stamp_url),
      fetchClientSignatureDataUri(document.client_signature_url),
    ]);

  // En-tête : logo uploadé en priorité, sinon repli sur le logo du site (Sanity).
  const logoData = uploadedLogo ?? (await fetchSiteLogoDataUri());
  // Filigrane : logo uploadé dans le bucket uniquement (sinon monogramme « SP »).
  const watermarkData = uploadedLogo;

  const element =
    document.type === "rapport_maintenance"
      ? ReportPDF({
          document,
          organization,
          client,
          logoData,
          watermarkData,
          signatureData,
          stampData,
          clientSignatureData,
        })
      : DocumentPDF({
          document,
          lines: [...lines].sort((a, b) => a.position - b.position),
          organization,
          client,
          categoryName,
          customTypeName,
          logoData,
          watermarkData,
          signatureData,
          stampData,
          clientSignatureData,
        });

  return renderToBuffer(element);
}
