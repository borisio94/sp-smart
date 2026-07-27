"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText } from "lucide-react";

import { documentSchema, type DocumentInput } from "@/lib/billing/validation";
import { computeTotals } from "@/lib/billing/compute";
import { amountToWords } from "@/lib/billing/amountToWords";
import {
  PAYMENT_METHOD_LABELS,
  DOCUMENT_TYPE_LABELS,
  formatMoney,
  formatDate,
} from "@/lib/billing/format";
import { FACTURE_TEMPLATES, emptyReport } from "@/lib/billing/templates";
import {
  createFacture,
  updateFacture,
} from "@/app/(admin)/admin/billing/(protected)/documents/actions";
import type { Client, Category, PaymentMethod } from "@/lib/billing/types";
import type { DocumentWithLines, QuotationOption } from "@/lib/billing/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  clients: Client[];
  categories: Category[];
  quotations: QuotationOption[];
  defaultIssueDate: string;
  defaultPaymentTerms?: string | null;
  defaultDeliveryTerms?: string | null;
  defaultTaxRate?: number;
  defaultClientId?: string;
  document?: DocumentWithLines;
}

/**
 * Valeurs initiales d'une facture (création ou édition). Une facture n'a qu'une
 * seule ligne de tableau : elle porte le montant saisi (l'acompte, ou le solde).
 */
function buildFactureDefaults(props: Props): DocumentInput {
  const d = props.document;
  const inv = d?.invoice_data ?? null;
  const line = d?.lines?.[0];
  return {
    type: "facture",
    custom_type_id: "",
    client_id: d?.client_id ?? props.defaultClientId ?? "",
    category_id: d?.category_id ?? "",
    linked_document_id: d?.linked_document_id ?? "",
    issue_date: d?.issue_date ?? props.defaultIssueDate,
    validity_date: "",
    title: d?.title ?? "",
    subject: d?.subject ?? "",
    client_ref: d?.client_ref ?? "",
    body_mode: "table",
    body_text: "",
    lines: [
      {
        designation: line?.designation ?? "",
        unit: line?.unit ?? "",
        quantity: 1,
        unit_price: line?.unit_price ?? 0,
      },
    ],
    labor_amount: 0,
    discount_amount: 0,
    tax_rate: d?.tax_rate ?? props.defaultTaxRate ?? 0,
    payment_terms: d?.payment_terms ?? props.defaultPaymentTerms ?? "",
    delivery_terms: d?.delivery_terms ?? props.defaultDeliveryTerms ?? "",
    // Encadré « Conditions » actif par défaut (décochable).
    include_conditions: d?.include_conditions ?? true,
    signature_required: d?.signature_required ?? false,
    notes_internes: d?.notes_internes ?? "",
    report: emptyReport(),
    invoice: {
      kind: inv?.kind ?? "acompte",
      payment_method: inv?.payment_method ?? "",
      devis_ref: inv?.devis_ref ?? "",
      advance_percent: null,
      advance_amount: 0,
      deductions: [],
    },
  };
}

/**
 * Formulaire de facture en une seule page (facture d'acompte ou facture
 * définitive). La saisie est réduite au strict nécessaire : nature, client,
 * date, titre, objet, montant, TVA, conditions. Le tableau (une ligne) et le
 * montant en lettres sont générés automatiquement.
 */
export function FactureForm(props: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(props.document);

  const methods = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: buildFactureDefaults(props),
    mode: "onTouched",
  });
  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = methods;

  const watched = watch();
  const kind = watched.invoice?.kind ?? "acompte";

  // Cotations (devis / proforma / bon de commande) du client sélectionné,
  // proposées à lier. Vide = un devis sera créé automatiquement.
  const clientQuotations = props.quotations.filter(
    (q) => q.client_id === watched.client_id && q.id !== props.document?.id,
  );

  // Report automatique de la « Réf client » (code CLI-…) à la sélection.
  const selectedClientId = watched.client_id;
  useEffect(() => {
    if (!selectedClientId) return;
    const current = getValues("client_ref");
    if (current && current.trim() !== "") return;
    const ref = props.clients.find((c) => c.id === selectedClientId)?.ref;
    if (ref) setValue("client_ref", ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // Désignation de l'unique ligne = titre (repli objet, puis « Prestation ») :
  // garantit une désignation non vide sans la demander à l'utilisateur.
  const title = watched.title;
  const subject = watched.subject;
  useEffect(() => {
    const label = title?.trim() || subject?.trim() || "Prestation";
    setValue("lines.0.designation", label);
  }, [title, subject, setValue]);

  // Totaux live (une seule ligne) + montant en toutes lettres.
  const totals = computeTotals({
    body_mode: "table",
    lines: watched.lines ?? [],
    labor_amount: 0,
    discount_amount: 0,
    tax_rate: watched.tax_rate ?? 0,
  });
  const amountWords = amountToWords(totals.totalAmount);

  /** Insère le modèle (objet + conditions) selon la nature de la facture. */
  function applyTemplate() {
    const tpl = FACTURE_TEMPLATES[kind];
    const hasContent = [
      getValues("subject"),
      getValues("payment_terms"),
      getValues("delivery_terms"),
    ].some((v) => (v ?? "").trim() !== "");
    if (hasContent && !window.confirm(t("documents.applyTemplateConfirm"))) return;
    if (tpl.subject !== undefined) setValue("subject", tpl.subject);
    if (tpl.payment_terms !== undefined) setValue("payment_terms", tpl.payment_terms);
    if (tpl.delivery_terms !== undefined) setValue("delivery_terms", tpl.delivery_terms);
    setValue("include_conditions", true);
    toast.success(t("documents.templateApplied"));
  }

  function onSubmit(values: DocumentInput) {
    startTransition(async () => {
      const res = props.document
        ? await updateFacture(props.document.id, values)
        : await createFacture(values);
      if (res.ok) {
        toast.success(isEdit ? t("documents.updated") : t("documents.created"));
        router.push(
          res.id ? `/admin/billing/documents/${res.id}` : "/admin/billing/documents",
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onInvalid() {
    toast.error(t("documents.formInvalid"));
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  const reqMark = (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );

  const amountLabel =
    kind === "acompte"
      ? t("documents.factureAmountAcompte")
      : t("documents.factureAmountSolde");

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="max-w-3xl space-y-6"
        noValidate
      >
        {/* Nature de la facture */}
        <fieldset className="rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">
            {t("documents.invoiceKind")}
          </legend>
          <div className="mt-1 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="acompte" {...register("invoice.kind")} />
              {t("documents.invoiceKindAcompte")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="definitive" {...register("invoice.kind")} />
              {t("documents.invoiceKindDefinitive")}
            </label>
          </div>
        </fieldset>

        {/* Client + date */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="f-client">
              {t("documents.client")}
              {reqMark}
            </Label>
            <Select
              id="f-client"
              className="mt-1"
              aria-invalid={errors.client_id ? true : undefined}
              {...register("client_id")}
            >
              <option value="">{t("documents.chooseClient")}</option>
              {props.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ref ? `${c.ref} — ${c.name}` : c.name}
                </option>
              ))}
            </Select>
            {err(errors.client_id?.message)}
            <p className="mt-1 text-sm text-muted-foreground">
              {t("documents.clientHint")}{" "}
              <Link
                href="/admin/billing/clients/nouveau"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("documents.createClientLink")}
              </Link>
            </p>
          </div>
          <div>
            <Label htmlFor="f-issue">
              {t("documents.issueDate")}
              {reqMark}
            </Label>
            <Input
              id="f-issue"
              type="date"
              className="mt-1"
              aria-invalid={errors.issue_date ? true : undefined}
              {...register("issue_date")}
            />
            {err(errors.issue_date?.message)}
          </div>
        </div>

        {/* Titre + objet */}
        <div className="grid gap-4">
          <div>
            <Label htmlFor="f-title">
              {t("documents.docTitle")}
              {reqMark}
            </Label>
            <Input
              id="f-title"
              className="mt-1"
              placeholder={t("documents.titlePlaceholder")}
              {...register("title")}
            />
          </div>
          <div>
            <Label htmlFor="f-subject">{t("documents.subject")}</Label>
            <Input
              id="f-subject"
              className="mt-1"
              placeholder={t("documents.subjectPlaceholder")}
              {...register("subject")}
            />
          </div>
        </div>

        {/* Montant (→ ligne unique) + TVA */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="f-amount">
              {amountLabel}
              {reqMark}
            </Label>
            <Input
              id="f-amount"
              type="number"
              step="1"
              min="0"
              className="mt-1"
              aria-invalid={errors.lines?.[0]?.unit_price ? true : undefined}
              {...register("lines.0.unit_price", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("documents.factureAmountHint")}
            </p>
          </div>
          <div>
            <Label htmlFor="f-tax">{t("documents.taxRateVat")}</Label>
            <Input
              id="f-tax"
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="mt-1"
              {...register("tax_rate", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Mode de règlement + réf. devis (facultatifs) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="f-method">{t("documents.paymentMethod")}</Label>
            <Select id="f-method" className="mt-1" {...register("invoice.payment_method")}>
              <option value="">{t("documents.paymentMethodNone")}</option>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-quotation">{t("documents.linkedQuotation")}</Label>
            <Select
              id="f-quotation"
              className="mt-1"
              {...register("linked_document_id")}
            >
              <option value="">{t("documents.linkedQuotationAuto")}</option>
              {clientQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.number} — {DOCUMENT_TYPE_LABELS[q.type]} — {formatDate(q.issue_date)}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("documents.linkedQuotationHint")}
            </p>
          </div>
        </div>

        {/* Catégorie (facultatif, pour les statistiques) */}
        <div className="max-w-sm">
          <Label htmlFor="f-category">{t("documents.category")}</Label>
          <Select id="f-category" className="mt-1" {...register("category_id")}>
            <option value="">{t("documents.noCategory")}</option>
            {props.categories
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_fr}
                </option>
              ))}
          </Select>
        </div>

        {/* Récapitulatif live : totaux + montant en lettres */}
        <div className="rounded-xl bg-muted/40 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("documents.materialsSubtotal")}</span>
            <span className="tabular-nums">{formatMoney(totals.materialsSubtotal)}</span>
          </div>
          {totals.taxRate > 0 ? (
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">
                {t("documents.vat")} ({totals.taxRate} %)
              </span>
              <span className="tabular-nums">{formatMoney(totals.taxAmount)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
            <span>
              {totals.taxRate > 0 ? t("documents.totalTTC") : t("documents.totalHT")}
            </span>
            <span className="tabular-nums">{formatMoney(totals.totalAmount)}</span>
          </div>
          <p className="mt-3 border-t border-border pt-2 text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("documents.amountInWords")} :{" "}
            </span>
            {amountWords}
          </p>
        </div>

        {/* Conditions (encadré actif par défaut) */}
        <div className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{t("documents.conditions")}</p>
            <Button type="button" variant="outline" size="sm" onClick={applyTemplate}>
              <FileText className="size-4" />
              {t("documents.applyTemplate", {
                type:
                  kind === "acompte"
                    ? t("documents.invoiceKindAcompte")
                    : t("documents.invoiceKindDefinitive"),
              })}
            </Button>
          </div>
          <div>
            <Label htmlFor="f-payterms">{t("documents.paymentTerms")}</Label>
            <Textarea id="f-payterms" className="mt-1" {...register("payment_terms")} />
          </div>
          <div>
            <Label htmlFor="f-delterms">{t("documents.deliveryTerms")}</Label>
            <Textarea id="f-delterms" className="mt-1" {...register("delivery_terms")} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" {...register("include_conditions")} />
            <span>
              <span className="font-medium">{t("documents.includeConditions")}</span>
              <span className="mt-0.5 block text-muted-foreground">
                {t("documents.includeConditionsHint")}
              </span>
            </span>
          </label>
          {/* Signature électronique du client sur son lien privé. */}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" {...register("signature_required")} />
            <span>
              <span className="font-medium">{t("documents.signatureRequired")}</span>
              <span className="mt-0.5 block text-muted-foreground">
                {t("documents.signatureRequiredHint")}
              </span>
            </span>
          </label>
          {/* Le document a déjà été signé : l'enregistrer annulera la signature. */}
          {props.document?.signed_at ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {t("documents.signatureVoidWarning")}
            </p>
          ) : null}
          <div>
            <Label htmlFor="f-notes">{t("documents.internalNotes")}</Label>
            <Textarea
              id="f-notes"
              className="mt-1"
              placeholder={t("documents.internalNotesHint")}
              {...register("notes_internes")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? t("common.saving") : t("documents.saveDraft")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={pending}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
