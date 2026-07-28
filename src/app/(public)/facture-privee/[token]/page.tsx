import { getPublicDocument } from "@/lib/billing/public-stats";
import { DOCUMENT_TYPE_LABELS, formatMoney, formatDate, formatNumber } from "@/lib/billing/format";
import { PUBLIC_DOC_LABELS as L } from "@/lib/billing/public-labels";
import { buildSettlement } from "@/lib/billing/settlement";
import { ClientSignatureBlock } from "@/components/billing/client-signature-block";
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
        <h1 className="text-xl font-semibold">{L.unavailableTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{L.unavailableText}</p>
      </main>
    );
  }

  const { document: doc, lines } = result;
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type as DocumentType] ?? doc.type;
  const amountWords = doc.amount_in_words?.trim();
  const isReport = doc.type === "rapport_maintenance";

  // Suivi du marché : une facture d'acompte ne porte qu'une part du devis
  // d'origine. On rappelle alors ce qui reste dû sur l'ensemble, sinon le
  // client ne verrait que le montant de cette facture.
  const settlement = buildSettlement({
    quotationNumber: doc.quotation_number ?? null,
    marketTotal: doc.market_total,
    invoicedTotal: doc.invoiced_total,
    settledTotal: doc.settled_total,
  });
  const market =
    settlement && settlement.marketTotal > doc.total_amount ? settlement : null;

  // Signature : proposée si l'émetteur l'a demandée (quel que soit le type de
  // document), que le document est finalisé (un brouillon n'engage pas) et
  // qu'il n'est pas déjà signé. Mêmes conditions que celles revérifiées par
  // l'endpoint.
  const alreadySigned = Boolean(doc.signed_at);
  const canSign =
    Boolean(doc.signature_required) &&
    doc.status !== "brouillon" &&
    !alreadySigned;

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
              <p className="text-xs uppercase text-muted-foreground">{L.recipient}</p>
              <p className="font-medium">{doc.client_name ?? "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-muted-foreground">{L.date}</p>
              <p>{formatDate(doc.issue_date)}</p>
            </div>
          </div>

          {doc.subject ? (
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">{L.subject}</p>
              <p>{doc.subject}</p>
            </div>
          ) : null}

          {/* Corps */}
          {doc.body_mode === "table" && lines.length > 0 ? (
            <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{L.designation}</th>
                    <th className="px-3 py-2 text-right font-medium">{L.quantity}</th>
                    <th className="px-3 py-2 text-right font-medium">{L.unitPrice}</th>
                    <th className="px-3 py-2 text-right font-medium">{L.total}</th>
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

          {/* Net à payer — sans objet pour un rapport de maintenance. */}
          {isReport ? null : (
            <>
              <div className="flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground">
                <span className="font-semibold">{L.netToPay}</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatMoney(doc.total_amount)}
                </span>
              </div>
              {amountWords ? (
                <p className="text-xs italic text-muted-foreground">{amountWords}.</p>
              ) : null}
            </>
          )}

          {/* Reste à payer sur le marché (facture d'acompte) */}
          {market ? (
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                {L.marketTitle}
                {market.quotationNumber ? ` — ${market.quotationNumber}` : ""}
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{L.marketTotal}</span>
                <span className="tabular-nums">{formatMoney(market.marketTotal)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">{L.marketSettled}</span>
                <span className="tabular-nums">{formatMoney(market.settledTotal)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border pt-1.5 font-semibold">
                <span>{L.marketRemaining}</span>
                <span className="tabular-nums">{formatMoney(market.remaining)}</span>
              </div>
            </div>
          ) : null}

          {doc.payment_terms ? (
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">{L.paymentTerms}</p>
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
            {L.downloadPdf}
          </a>
        </div>
      </div>

      {/* Signature électronique du client */}
      {canSign ? (
        <ClientSignatureBlock token={token} defaultName={doc.client_name ?? ""} />
      ) : null}

      {alreadySigned ? (
        <div className="mt-6 rounded-2xl bg-background p-5 ring-1 ring-foreground/10">
          <p className="text-sm font-semibold">
            {L.signedBadge(doc.signed_by_name ?? "—", formatDate(doc.signed_at))}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{L.signedNotice}</p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {L.issuedBy(doc.organization_name ?? "SP Smart Sarl")}
      </p>
    </main>
  );
}
