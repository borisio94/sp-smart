import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDocument, getOrganization } from "@/lib/billing/queries";
import { renderDocumentPdf } from "@/lib/billing/pdf/render";
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

  const buffer = await renderDocumentPdf({
    document: doc,
    lines: doc.lines,
    organization,
    client: doc.client,
    categoryName: doc.category?.name_fr ?? null,
    customTypeName: doc.custom_type?.name ?? null,
  });

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
