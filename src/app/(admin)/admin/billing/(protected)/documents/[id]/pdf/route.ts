import { renderToBuffer } from "@react-pdf/renderer";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDocument, getOrganization } from "@/lib/billing/queries";
import { DocumentPDF } from "@/lib/billing/pdf/DocumentPDF";
import { fetchBrandingDataUri } from "@/lib/billing/pdf/branding";
import { fetchSiteLogoDataUri } from "@/lib/billing/pdf/site-logo";
import { pdfFilename } from "@/lib/billing/pdf/filename";

// react-pdf nécessite le runtime Node.js (pas Edge).
export const runtime = "nodejs";

/**
 * Génère et stream le PDF d'un document à la volée.
 * GET /admin/billing/documents/[id]/pdf
 *  - ?dl=1 force le téléchargement (Content-Disposition: attachment)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  // Vérifie la session (la RLS protège déjà les données, mais on bloque tôt).
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé", { status: 401 });
  }

  const [doc, organization] = await Promise.all([getDocument(id), getOrganization()]);
  if (!doc || !organization) {
    return new Response("Document introuvable", { status: 404 });
  }

  // Charge les images de marque (signature, cachet) en base64.
  const [uploadedLogo, signatureData, stampData] = await Promise.all([
    fetchBrandingDataUri(organization.logo_url),
    fetchBrandingDataUri(organization.signature_url),
    fetchBrandingDataUri(organization.stamp_url),
  ]);
  // En-tête : logo uploadé en priorité, sinon repli sur le logo du site (Sanity).
  const logoData = uploadedLogo ?? (await fetchSiteLogoDataUri());
  // Filigrane : logo uploadé dans le bucket uniquement (sinon monogramme "SP").
  const watermarkData = uploadedLogo;

  const buffer = await renderToBuffer(
    DocumentPDF({
      document: doc,
      lines: doc.lines,
      organization,
      client: doc.client,
      categoryName: doc.category?.name_fr ?? null,
      logoData,
      watermarkData,
      signatureData,
      stampData,
    }),
  );

  const url = new URL(request.url);
  const download = url.searchParams.get("dl") === "1";
  const filename = pdfFilename(doc, doc.client?.name ?? null);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
