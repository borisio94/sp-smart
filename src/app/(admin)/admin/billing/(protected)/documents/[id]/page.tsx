import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getDocument } from "@/lib/billing/queries";
import { canReceivePayment } from "@/lib/billing/payments";
import {
  documentTypeLabel,
  factureTitleLabel,
  formatMoney,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/billing/format";
import { deductionsTotal, groupSections, hasNamedSections } from "@/lib/billing/compute";
import { shortHash } from "@/lib/billing/signature";
import { INTERVENTION_TYPE_LABELS } from "@/lib/billing/templates";
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

  // Un rapport de maintenance affiche ses sections techniques (pas de totaux).
  const isReport = doc.type === "rapport_maintenance";
  const r = doc.report_data;

  // Sections (« compartiments ») du tableau.
  const docSections = groupSections(doc.lines);
  const docSectioned = hasNamedSections(doc.lines);

  // Facture : nature (acompte / définitive) et montants de règlement.
  const isFacture = doc.type === "facture";
  const inv = isFacture ? doc.invoice_data : null;
  const invDeducted = deductionsTotal(inv?.deductions ?? []);
  const invNet = Math.max(0, doc.total_amount - invDeducted);
  const invSoldeRestant = Math.max(0, doc.total_amount - (inv?.advance_amount ?? 0));
  const headTitle = isFacture
    ? `${factureTitleLabel(inv?.kind)} ${doc.number ?? ""}`.trim()
    : `${documentTypeLabel(doc)} ${doc.number ?? ""}`.trim();

  return (
    <div>
      <PageHeader title={headTitle} subtitle={doc.title ?? undefined} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={doc.status} />
        {canReceivePayment(doc.type, doc.status) ? (
          <PaymentBadge status={doc.payment_status} />
        ) : null}
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
          {isReport ? (
            /* ── Rapport de maintenance : sections techniques ── */
            <Card>
              <CardHeader>
                <CardTitle>{t("documents.report.cardTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {r ? (
                  <>
                    <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      <Row label={t("documents.report.interventionType")}>
                        {INTERVENTION_TYPE_LABELS[r.intervention_type] ?? "—"}
                      </Row>
                      <Row label={t("documents.report.site")}>{r.site || "—"}</Row>
                      <Row label={t("documents.report.interventionDate")}>
                        {r.intervention_date || "—"}
                      </Row>
                      <Row label={t("documents.report.hours")}>
                        {[r.start_time, r.end_time].filter(Boolean).join(" → ") || "—"}
                      </Row>
                      <Row label={t("documents.report.technicians")}>{r.technicians || "—"}</Row>
                    </div>

                    <Section title={t("documents.report.request")}>{r.request}</Section>

                    {r.equipments.length > 0 ? (
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          {t("documents.report.equipments")}
                        </p>
                        <ul className="space-y-1">
                          {r.equipments.map((e, i) => (
                            <li key={i} className="border-b border-border/60 py-1">
                              {[e.designation, e.brand_model, e.serial, e.location]
                                .filter((v) => v && v.trim() !== "")
                                .join(" · ") || "—"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Section title={t("documents.report.diagnosis")}>{r.diagnosis}</Section>

                    {r.operations.length > 0 ? (
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          {t("documents.report.operations")}
                        </p>
                        <ul className="space-y-1">
                          {r.operations.map((o, i) => (
                            <li key={i} className="flex justify-between gap-3 border-b border-border/60 py-1">
                              <span>{o.description || "—"}</span>
                              <span className="text-muted-foreground">
                                {[o.status, o.duration].filter((v) => v && v.trim() !== "").join(" · ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {r.parts.length > 0 ? (
                      <div>
                        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          {t("documents.report.parts")}
                        </p>
                        <ul className="space-y-1">
                          {r.parts.map((p, i) => (
                            <li key={i} className="flex justify-between gap-3 border-b border-border/60 py-1">
                              <span>{p.designation || "—"}</span>
                              <span className="tabular-nums text-muted-foreground">{formatNumber(p.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Section title={t("documents.report.tests")}>{r.tests}</Section>
                    {r.conformity ? (
                      <Row label={t("documents.report.conformity")}>{r.conformity}</Row>
                    ) : null}
                    <Section title={t("documents.report.observations")}>{r.observations}</Section>

                    <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      <Row label={t("documents.report.finalState")}>{r.final_state || "—"}</Row>
                      <Row label={t("documents.report.nextMaintenance")}>
                        {r.next_maintenance || "—"}
                      </Row>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
                {doc.notes_internes ? (
                  <Section title={t("documents.internalNotes")}>{doc.notes_internes}</Section>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <>
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
                        {docSectioned
                          ? docSections.map((group, gi) => (
                              <Fragment key={gi}>
                                {group.title ? (
                                  <tr className="bg-muted/50">
                                    <td colSpan={4} className="py-1.5 text-center text-xs font-semibold uppercase">
                                      {group.title}
                                    </td>
                                  </tr>
                                ) : null}
                                {group.lines.map((l) => (
                                  <tr
                                    key={l.id}
                                    className={`border-b border-border/60${l.is_amount_only ? " font-semibold" : ""}`}
                                  >
                                    <td className="py-2">{l.designation}</td>
                                    <td className="py-2 text-right tabular-nums">{l.is_amount_only ? "—" : formatNumber(l.quantity)}</td>
                                    <td className="py-2 text-right tabular-nums">{l.is_amount_only ? "—" : formatMoney(l.unit_price)}</td>
                                    <td className="py-2 text-right tabular-nums">{formatMoney(l.line_total)}</td>
                                  </tr>
                                ))}
                                <tr className="border-b border-border bg-muted/30 font-medium">
                                  <td colSpan={3} className="py-1.5">{`Total ${gi + 1}`}</td>
                                  <td className="py-1.5 text-right tabular-nums">{formatMoney(group.subtotal)}</td>
                                </tr>
                              </Fragment>
                            ))
                          : doc.lines.map((l) => (
                              <tr
                                key={l.id}
                                className={`border-b border-border/60${l.is_amount_only ? " font-semibold" : ""}`}
                              >
                                <td className="py-2">{l.designation}</td>
                                <td className="py-2 text-right tabular-nums">{l.is_amount_only ? "—" : formatNumber(l.quantity)}</td>
                                <td className="py-2 text-right tabular-nums">{l.is_amount_only ? "—" : formatMoney(l.unit_price)}</td>
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
            </>
          )}

          {/* Paiements (factures uniquement) */}
          {canReceivePayment(doc.type, doc.status) ? (
            <PaymentSection
              documentId={doc.id}
              totalAmount={doc.total_amount}
              factureKind={inv?.kind ?? null}
            />
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
              {doc.client?.niu ? (
                <Row label={t("clients.niu")}>{doc.client.niu}</Row>
              ) : null}
              <Row label={t("documents.subject")}>{doc.subject ?? "—"}</Row>
              <Row label={t("documents.issueDate")}>{formatDate(doc.issue_date)}</Row>
              <Row label={t("documents.validityDate")}>{formatDate(doc.validity_date)}</Row>
            </CardContent>
          </Card>

          {/* Signature électronique du client (si demandée sur ce document) */}
          {doc.signature_required || doc.signed_at ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("documents.signature")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {doc.signed_at ? (
                  <>
                    <Row label={t("documents.signedBy")}>{doc.signed_by_name ?? "—"}</Row>
                    {doc.signed_by_email ? (
                      <Row label={t("clients.email")}>{doc.signed_by_email}</Row>
                    ) : null}
                    <Row label={t("documents.signedAt")}>{formatDateTime(doc.signed_at)}</Row>
                    <Row label={t("documents.signatureHash")}>
                      <span className="font-mono">{shortHash(doc.signature_doc_hash)}</span>
                    </Row>
                  </>
                ) : doc.status === "brouillon" ? (
                  /* Un brouillon n'engage pas : la page publique n'affiche pas
                     le bloc de signature tant que le document n'est pas envoyé. */
                  <p className="rounded-lg bg-destructive/10 p-3 text-destructive">
                    {t("documents.signatureDraftBlocked")}
                  </p>
                ) : (
                  <p className="text-muted-foreground">{t("documents.signaturePending")}</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {!isReport ? (
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
              {doc.tax_rate > 0 ? (
                <Row label={`${t("documents.tax")} (${formatNumber(doc.tax_rate)} %)`}>
                  <span className="tabular-nums">{formatMoney(doc.tax_amount)}</span>
                </Row>
              ) : null}
              <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
                {/* taux = 0 → total hors taxe (HT) ; taux > 0 → total toutes taxes (TTC) */}
                <span>{doc.tax_rate > 0 ? t("documents.totalTTC") : t("documents.totalHT")}</span>
                <span className="tabular-nums">{formatMoney(doc.total_amount)}</span>
              </div>

              {/* Récapitulatif de règlement, seulement si des acomptes le justifient */}
              {isFacture && inv && inv.kind === "acompte" && inv.advance_amount > 0 ? (
                <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                  <Row label={t("documents.advanceAmount")}>
                    <span className="tabular-nums text-destructive">- {formatMoney(inv.advance_amount)}</span>
                  </Row>
                  <div className="flex justify-between font-semibold">
                    <span>{t("documents.soldeRestant")}</span>
                    <span className="tabular-nums">{formatMoney(invSoldeRestant)}</span>
                  </div>
                </div>
              ) : isFacture && inv && inv.kind === "definitive" && invDeducted > 0 ? (
                <div className="mt-2 space-y-1.5 border-t border-border pt-2">
                  <Row label={t("documents.deductionsTitle")}>
                    <span className="tabular-nums text-destructive">- {formatMoney(invDeducted)}</span>
                  </Row>
                  <div className="flex justify-between font-semibold">
                    <span>{t("documents.netAPayer")}</span>
                    <span className="tabular-nums">{formatMoney(invNet)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          ) : null}

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

/** Bloc titré avec texte multiligne (sections du rapport). Masqué si vide. */
function Section({ title, children }: { title: string; children?: string | null }) {
  if (!children || children.trim() === "") return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <p className="whitespace-pre-wrap">{children}</p>
    </div>
  );
}
