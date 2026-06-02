import { renderToBuffer } from "@react-pdf/renderer";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DocumentPDF } from "@/lib/billing/pdf/DocumentPDF";
import { fetchBrandingDataUri } from "@/lib/billing/pdf/branding";
import { fetchSiteLogoDataUri } from "@/lib/billing/pdf/site-logo";
import { pdfFilename } from "@/lib/billing/pdf/filename";
import type {
  BillingDocument,
  DocumentLine,
  Organization,
  Client,
} from "@/lib/billing/types";

export const runtime = "nodejs";

/**
 * PDF public d'un document via son share_token (lien privé client).
 * Accès sans authentification mais protégé par le token UUID secret.
 * Utilise la clé service role côté serveur pour assembler le document complet,
 * en refusant les documents annulés.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const admin = createSupabaseAdminClient();

  // Récupère le document par token (service role : on filtre nous-mêmes).
  const { data: doc } = await admin
    .from("documents")
    .select("*, lines:document_lines(*), client:clients(*), category:categories(name_fr), organization:organizations(*)")
    .eq("share_token", token)
    .maybeSingle();

  if (!doc || doc.status === "annule") {
    return new Response("Document indisponible", { status: 404 });
  }

  const document = doc as BillingDocument & {
    lines: DocumentLine[];
    client: Client | null;
    category: { name_fr: string } | null;
    organization: Organization;
  };

  const org = document.organization;
  const [uploadedLogo, signatureData, stampData] = await Promise.all([
    fetchBrandingDataUri(org.logo_url),
    fetchBrandingDataUri(org.signature_url),
    fetchBrandingDataUri(org.stamp_url),
  ]);
  // En-tête : logo uploadé en priorité, sinon repli sur le logo du site (Sanity).
  const logoData = uploadedLogo ?? (await fetchSiteLogoDataUri());
  // Filigrane : logo uploadé dans le bucket uniquement (sinon monogramme "SP").
  const watermarkData = uploadedLogo;

  const buffer = await renderToBuffer(
    DocumentPDF({
      document,
      lines: (document.lines ?? []).sort((a, b) => a.position - b.position),
      organization: org,
      client: document.client,
      categoryName: document.category?.name_fr ?? null,
      logoData,
      watermarkData,
      signatureData,
      stampData,
    }),
  );

  const filename = pdfFilename(document, document.client?.name ?? null);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
