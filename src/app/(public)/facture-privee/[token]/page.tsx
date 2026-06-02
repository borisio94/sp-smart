import { getPublicDocument } from "@/lib/billing/public-stats";
import { DOCUMENT_TYPE_LABELS, formatMoney, formatDate, formatNumber } from "@/lib/billing/format";
import type { DocumentType } from "@/lib/billing/types";

/**
 * Page publique d'un document partagé par lien privé (token UUID).
 * Aperçu HTML mobile-friendly + téléchargement PDF + contact.
 * Aucune authentification ; les données viennent d'une RPC SECURITY DEFINER
 * qui exclut déjà les documents annulés.
 */
export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getPublicDocument(token);

  // Token inconnu, document annulé ou Supabase non configuré → page neutre.
  if (!result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold">Document indisponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce lien n&apos;est plus valide ou le document a été retiré.
        </p>
      </main>
    );
  }

  const { document: doc, lines } = result;
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type;
  const amountWords = doc.amount_in_words?.trim();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* En-tête */}
      <header className="mb-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {doc.organization_name ?? "SP Smart Sarl"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{typeLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">N° {doc.number ?? "—"}</p>
      </header>

      {/* Carte document */}
      <div className="overflow-hidden rounded-2xl bg-background ring-1 ring-foreground/10">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Destinataire</p>
              <p className="font-medium">{doc.client_name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-muted-foreground">Date</p>
              <p>{formatDate(doc.issue_date)}</p>
            </div>
          </div>

          {doc.subject ? (
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">Objet</p>
              <p>{doc.subject}</p>
            </div>
          ) : null}

          {/* Corps */}
          {doc.body_mode === "table" && lines.length > 0 ? (
            <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Désignation</th>
                    <th className="px-3 py-2 text-right font-medium">Qté</th>
                    <th className="px-3 py-2 text-right font-medium">P.U.</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.position} className="border-t border-border">
                      <td className="px-3 py-2">{l.designation}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(l.quantity)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.unit_price)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : doc.body_text ? (
            <p className="whitespace-pre-wrap text-sm">{doc.body_text}</p>
          ) : null}

          {/* Net à payer */}
          <div className="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-semibold">NET À PAYER</span>
            <span className="text-lg font-bold tabular-nums">{formatMoney(doc.total_amount)}</span>
          </div>
          {amountWords ? (
            <p className="text-xs italic text-muted-foreground">{amountWords}.</p>
          ) : null}

          {doc.payment_terms ? (
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">Modalités de paiement</p>
              <p className="whitespace-pre-wrap">{doc.payment_terms}</p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border bg-muted/40 p-4 sm:flex-row">
          <a
            href={`/facture-privee/${token}/pdf`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Télécharger en PDF
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Document émis par {doc.organization_name ?? "SP Smart Sarl"}.
      </p>
    </main>
  );
}
