import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getDocument } from "@/lib/billing/queries";
import {
  DOCUMENT_TYPE_LABELS,
  formatMoney,
  formatDate,
  formatNumber,
} from "@/lib/billing/format";
import { deleteDocument } from "../actions";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { DeleteButton } from "@/components/billing/delete-button";
import { StatusBadge, PaymentBadge } from "@/components/billing/status-badge";
import { StatusActions } from "@/components/billing/status-actions";
import { StatusTimeline } from "@/components/billing/status-timeline";
import { PaymentSection } from "@/components/billing/payment-section";
import { WhatsAppShare } from "@/components/billing/whatsapp-share";
import { siteUrl } from "@/lib/site";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Détail d'un document : récap, lignes, totaux, conditions, actions. */
export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Admin");
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  return (
    <div>
      <PageHeader
        title={`${DOCUMENT_TYPE_LABELS[doc.type]} ${doc.number ?? ""}`.trim()}
        subtitle={doc.title ?? undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={doc.status} />
        {doc.type === "facture" ? <PaymentBadge status={doc.payment_status} /> : null}
        <div className="flex flex-wrap gap-2 sm:ml-auto sm:gap-3">
          <a
            href={`/admin/billing/documents/${id}/pdf?dl=1`}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            {t("documents.downloadPdf")}
          </a>
          <a
            href={`/admin/billing/documents/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
          >
            {t("documents.previewPdf")}
          </a>
          <AdminLink href={`/admin/billing/documents/${id}/modifier`} variant="outline" size="sm">
            {t("common.edit")}
          </AdminLink>
          <DeleteButton id={id} action={deleteDocument} redirectTo="/admin/billing/documents" />
        </div>
      </div>

      {/* Barre d'actions de statut (machine d'états) */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t("status.changeTo")}
        </span>
        <StatusActions id={id} status={doc.status} />
      </div>

      {/* Partage du lien privé client */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {t("share.title")}
        </span>
        <WhatsAppShare
          shareToken={doc.share_token}
          type={doc.type}
          number={doc.number}
          clientName={doc.client?.name ?? null}
          clientPhone={doc.client?.whatsapp ?? doc.client?.phone ?? null}
          totalAmount={doc.total_amount}
          validityDate={doc.validity_date}
          siteUrl={siteUrl}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("documents.content")}</CardTitle>
            </CardHeader>
            <CardContent>
              {doc.body_mode === "table" ? (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 font-medium">{t("documents.designation")}</th>
                      <th className="py-2 text-right font-medium">{t("documents.quantity")}</th>
                      <th className="py-2 text-right font-medium">{t("documents.unitPrice")}</th>
                      <th className="py-2 text-right font-medium">{t("documents.lineTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.lines.map((l) => (
                      <tr key={l.id} className="border-b border-border/60">
                        <td className="py-2">{l.designation}</td>
                        <td className="py-2 text-right tabular-nums">{formatNumber(l.quantity)}</td>
                        <td className="py-2 text-right tabular-nums">{formatMoney(l.unit_price)}</td>
                        <td className="py-2 text-right tabular-nums">{formatMoney(l.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{doc.body_text || "—"}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("documents.conditions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  {t("documents.paymentTerms")}
                </p>
                <p className="whitespace-pre-wrap">{doc.payment_terms || "—"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  {t("documents.deliveryTerms")}
                </p>
                <p className="whitespace-pre-wrap">{doc.delivery_terms || "—"}</p>
              </div>
              {doc.notes_internes ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    {t("documents.internalNotes")}
                  </p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{doc.notes_internes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Paiements (factures uniquement) */}
          {doc.type === "facture" ? (
            <PaymentSection documentId={doc.id} totalAmount={doc.total_amount} />
          ) : null}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("documents.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label={t("documents.client")}>
                {doc.client_id ? (
                  <AdminLink
                    href={`/admin/billing/clients/${doc.client_id}`}
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                  >
                    {doc.client?.name ?? "—"}
                  </AdminLink>
                ) : (
                  "—"
                )}
              </Row>
              <Row label={t("documents.category")}>{doc.category?.name_fr ?? "—"}</Row>
              <Row label={t("documents.subject")}>{doc.subject ?? "—"}</Row>
              <Row label={t("documents.issueDate")}>{formatDate(doc.issue_date)}</Row>
              <Row label={t("documents.validityDate")}>{formatDate(doc.validity_date)}</Row>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("documents.totals")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <Row label={t("documents.materialsSubtotal")}>
                <span className="tabular-nums">{formatMoney(doc.materials_subtotal)}</span>
              </Row>
              <Row label={t("documents.laborAmount")}>
                <span className="tabular-nums">{formatMoney(doc.labor_amount)}</span>
              </Row>
              <Row label={t("documents.discountAmount")}>
                <span className="tabular-nums text-destructive">- {formatMoney(doc.discount_amount)}</span>
              </Row>
              <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
                <span>{t("documents.totalAmount")}</span>
                <span className="tabular-nums">{formatMoney(doc.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("status.timelineTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                document={doc}
                labels={{
                  created: t("status.ts_created"),
                  sent: t("status.ts_sent"),
                  confirmed: t("status.ts_confirmed"),
                  completed: t("status.ts_completed"),
                  cancelled: t("status.ts_cancelled"),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Ligne libellé/valeur réutilisable. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
