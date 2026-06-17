"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { documentSchema, type DocumentInput } from "@/lib/billing/validation";
import { computeTotals, lineTotal } from "@/lib/billing/compute";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  formatMoney,
} from "@/lib/billing/format";
import {
  createDocument,
  updateDocument,
  createCustomType,
  deleteCustomType,
} from "@/app/(admin)/admin/billing/(protected)/documents/actions";
import {
  createCategoryQuick,
  deleteCategory,
} from "@/app/(admin)/admin/billing/(protected)/parametres/categories/actions";
import type { Client, Category, CustomDocumentType } from "@/lib/billing/types";
import type { DocumentWithLines } from "@/lib/billing/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  clients: Client[];
  categories: Category[];
  customTypes: CustomDocumentType[];
  defaultIssueDate: string;
  defaultPaymentTerms?: string | null;
  defaultDeliveryTerms?: string | null;
  defaultTaxRate?: number;
  defaultClientId?: string;
  document?: DocumentWithLines;
}

/** Construit les valeurs initiales du formulaire (création ou édition). */
function buildDefaults(props: Props): DocumentInput {
  const d = props.document;
  if (d) {
    return {
      type: d.type,
      custom_type_id: d.custom_type_id ?? "",
      client_id: d.client_id ?? "",
      category_id: d.category_id ?? "",
      issue_date: d.issue_date,
      validity_date: d.validity_date ?? "",
      title: d.title ?? "",
      subject: d.subject ?? "",
      client_ref: d.client_ref ?? "",
      body_mode: d.body_mode,
      body_text: d.body_text ?? "",
      lines:
        d.lines.length > 0
          ? d.lines.map((l) => ({
              designation: l.designation,
              unit: l.unit ?? "",
              quantity: l.quantity,
              unit_price: l.unit_price,
            }))
          : [{ designation: "", unit: "", quantity: 1, unit_price: 0 }],
      labor_amount: d.labor_amount,
      discount_amount: d.discount_amount,
      tax_rate: d.tax_rate ?? 0,
      payment_terms: d.payment_terms ?? "",
      delivery_terms: d.delivery_terms ?? "",
      include_conditions: d.include_conditions ?? false,
      notes_internes: d.notes_internes ?? "",
    };
  }
  return {
    type: "devis",
    custom_type_id: "",
    client_id: props.defaultClientId ?? "",
    category_id: "",
    issue_date: props.defaultIssueDate,
    validity_date: "",
    title: "",
    subject: "",
    client_ref: "",
    body_mode: "table",
    body_text: "",
    lines: [{ designation: "", unit: "", quantity: 1, unit_price: 0 }],
    labor_amount: 0,
    discount_amount: 0,
    tax_rate: props.defaultTaxRate ?? 0,
    payment_terms: props.defaultPaymentTerms ?? "",
    delivery_terms: props.defaultDeliveryTerms ?? "",
    include_conditions: false,
    notes_internes: "",
  };
}

const STEPS = ["infos", "client", "body", "totals", "conditions"] as const;

/**
 * Champs obligatoires à valider AVANT de passer à l'étape suivante.
 * Chaque entrée liste les noms RHF à contrôler via `trigger()` : si l'un est
 * invalide, l'étape reste bloquée, le champ s'encadre en rouge (aria-invalid)
 * et un toast prévient l'utilisateur. Les refines de schéma (lignes vides,
 * corps texte vide, conditions du bon de commande, type personnalisé) sont
 * rattachés à ces mêmes chemins, donc couverts ici.
 */
const STEP_FIELDS: Record<number, (keyof DocumentInput)[]> = {
  0: ["issue_date", "custom_type_id"],
  1: ["client_id"],
  2: ["lines", "body_text"],
  3: ["labor_amount", "discount_amount", "tax_rate"],
  4: ["payment_terms"],
};

/** Formulaire de création / édition d'un document (parcours multi-étapes). */
export function DocumentForm(props: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const isEdit = Boolean(props.document);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: buildDefaults(props),
    mode: "onTouched",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  // Report automatique de la réf client : à la sélection d'un client, on
  // pré-remplit la « Réf client » avec son code (CLI-2026-0001) si le champ
  // est encore vide (reste librement modifiable ensuite).
  const selectedClientId = watch("client_id");
  useEffect(() => {
    if (!selectedClientId) return;
    const current = getValues("client_ref");
    if (current && current.trim() !== "") return; // ne pas écraser une saisie
    const ref = props.clients.find((c) => c.id === selectedClientId)?.ref;
    if (ref) setValue("client_ref", ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // Recalcul live des totaux. `watch()` (sans argument) ré-abonne le composant
  // à CHAQUE frappe : on recalcule donc directement à chaque rendu (calcul pur
  // et bon marché). Pas de useMemo ici, car RHF peut muter le tableau `lines`
  // en place sans changer sa référence — le total général resterait alors figé.
  const watched = watch();
  const totals = computeTotals({
    body_mode: watched.body_mode,
    lines: watched.lines ?? [],
    labor_amount: watched.labor_amount ?? 0,
    discount_amount: watched.discount_amount ?? 0,
    tax_rate: watched.tax_rate ?? 0,
  });

  function onSubmit(values: DocumentInput) {
    startTransition(async () => {
      const res = props.document
        ? await updateDocument(props.document.id, values)
        : await createDocument(values);
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

  // Affiche la première erreur si la validation échoue.
  function onInvalid() {
    toast.error(t("documents.formInvalid"));
  }

  // Enregistrement EXPLICITE : déclenché UNIQUEMENT par le clic sur le bouton
  // « Enregistrer » (jamais par la soumission native du <form>). L'utilisateur
  // garde le contrôle total : aucune sauvegarde automatique.
  function onSaveClick() {
    handleSubmit(onSubmit, onInvalid)();
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  // Astérisque rouge des libellés obligatoires.
  const reqMark = (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );

  // Navigation entre étapes. Reculer est toujours libre. Avancer exige que les
  // champs obligatoires de TOUTES les étapes franchies soient valides : sinon
  // on bloque, les champs concernés s'encadrent en rouge (errors → aria-invalid)
  // et un toast prévient l'utilisateur.
  async function goToStep(target: number) {
    if (target <= step) {
      setStep(target);
      return;
    }
    const toCheck: (keyof DocumentInput)[] = [];
    for (let s = step; s < target; s++) {
      toCheck.push(...(STEP_FIELDS[s] ?? []));
    }
    const valid = toCheck.length === 0 ? true : await trigger(toCheck);
    if (!valid) {
      toast.error(t("documents.stepInvalid"));
      return;
    }
    setStep(target);
  }

  const bodyMode = watched.body_mode;
  // L'encadré « conditions » est obligatoire (et verrouillé) pour un bon de commande.
  const conditionsForced = watched.type === "bon_commande";
  useEffect(() => {
    if (conditionsForced) setValue("include_conditions", true);
  }, [conditionsForced, setValue]);

  // ── Types de documents personnalisés (liste enrichie par les créations) ──
  const [customTypes, setCustomTypes] = useState<CustomDocumentType[]>(
    props.customTypes,
  );
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypePrefix, setNewTypePrefix] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  // ── Catégories (liste enrichie par les créations rapides) ──
  type CatOption = { id: string; name_fr: string; active: boolean };
  const [categories, setCategories] = useState<CatOption[]>(
    props.categories.map((c) => ({ id: c.id, name_fr: c.name_fr, active: c.active })),
  );
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  // Valeur du sélecteur de type : un type standard OU « custom:<id> ».
  const typeChoice = watched.custom_type_id
    ? `custom:${watched.custom_type_id}`
    : watched.type;

  function onTypeChange(value: string) {
    if (value.startsWith("custom:")) {
      setValue("custom_type_id", value.slice(7));
      setValue("type", "autre");
    } else {
      setValue("custom_type_id", "");
      setValue("type", value as DocumentInput["type"]);
    }
  }

  async function onCreateType() {
    const name = newTypeName.trim();
    const prefix = newTypePrefix.trim();
    if (name.length < 2 || prefix.length < 2) {
      toast.error(t("documents.customTypeInvalid"));
      return;
    }
    setCreatingType(true);
    const res = await createCustomType({ name, prefix });
    setCreatingType(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCustomTypes((list) => [...list, res.customType]);
    setValue("custom_type_id", res.customType.id);
    setValue("type", "autre");
    setNewTypeName("");
    setNewTypePrefix("");
    setShowTypeForm(false);
    toast.success(t("documents.customTypeCreated"));
  }

  async function onDeleteType() {
    const id = watched.custom_type_id;
    if (!id) return;
    if (!window.confirm(t("documents.deleteTypeConfirm"))) return;
    setCreatingType(true);
    const res = await deleteCustomType(id);
    setCreatingType(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCustomTypes((list) => list.filter((c) => c.id !== id));
    // L'élément sélectionné a disparu → on revient à un type standard.
    setValue("custom_type_id", "");
    setValue("type", "devis");
    toast.success(t("documents.customTypeDeleted"));
  }

  async function onCreateCategory() {
    const name = newCatName.trim();
    if (name.length < 2) {
      toast.error(t("documents.categoryQuickInvalid"));
      return;
    }
    setCreatingCat(true);
    const res = await createCategoryQuick(name);
    setCreatingCat(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCategories((list) => [
      ...list,
      { id: res.category.id, name_fr: res.category.name_fr, active: true },
    ]);
    setValue("category_id", res.category.id);
    setNewCatName("");
    setShowCatForm(false);
    toast.success(t("categories.created"));
  }

  async function onDeleteCategory() {
    const id = watched.category_id;
    if (!id) return;
    if (!window.confirm(t("documents.deleteCategoryConfirm"))) return;
    setCreatingCat(true);
    const res = await deleteCategory(id);
    setCreatingCat(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setCategories((list) => list.filter((c) => c.id !== id));
    setValue("category_id", "");
    toast.success(t("common.deleted"));
  }

  // Le <form> n'a PAS de onSubmit : il ne peut donc jamais se soumettre seul
  // (ni via Entrée, ni via un bouton). On bloque aussi explicitement la
  // soumission native par sécurité. Seul onSaveClick (bouton) enregistre.
  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={onFormSubmit}
      className="max-w-3xl space-y-6"
      noValidate
    >
      {/* Indicateur d'étapes */}
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => goToStep(i)}
              className={`rounded-full px-3 py-1 transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {i + 1}. {t(`documents.step_${s}`)}
            </button>
          </li>
        ))}
      </ol>

      {/* Étape 1 — Infos */}
      <section hidden={step !== 0} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="d-type">{t("documents.type")}</Label>
            <div className="mt-1 flex gap-2">
              <Select
                id="d-type"
                value={typeChoice}
                onChange={(e) => onTypeChange(e.target.value)}
                aria-invalid={errors.custom_type_id ? true : undefined}
              >
                {DOCUMENT_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {DOCUMENT_TYPE_LABELS[ty]}
                  </option>
                ))}
                {customTypes.filter((ct) => ct.active).length > 0 ? (
                  <optgroup label={t("documents.customTypesGroup")}>
                    {customTypes
                      .filter((ct) => ct.active)
                      .map((ct) => (
                        <option key={ct.id} value={`custom:${ct.id}`}>
                          {ct.name} ({ct.prefix})
                        </option>
                      ))}
                  </optgroup>
                ) : null}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setShowTypeForm((s) => !s)}
                aria-label={t("documents.addCustomType")}
              >
                <Plus className="size-4" />
              </Button>
              {watched.custom_type_id ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onDeleteType}
                  disabled={creatingType}
                  aria-label={t("documents.deleteCustomType")}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </div>
            {err(errors.custom_type_id?.message)}
            {showTypeForm ? (
              <div className="mt-2 grid gap-2 rounded-xl p-3 ring-1 ring-foreground/10 sm:grid-cols-[1fr_110px_auto]">
                <Input
                  placeholder={t("documents.customTypeNamePlaceholder")}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
                <Input
                  placeholder={t("documents.customTypePrefixPlaceholder")}
                  value={newTypePrefix}
                  maxLength={6}
                  onChange={(e) => setNewTypePrefix(e.target.value)}
                />
                <Button type="button" onClick={onCreateType} disabled={creatingType}>
                  {creatingType ? t("common.saving") : t("categories.add")}
                </Button>
              </div>
            ) : null}
          </div>
          <div>
            <Label htmlFor="d-category">{t("documents.category")}</Label>
            <div className="mt-1 flex gap-2">
              <Select
                id="d-category"
                value={watched.category_id ?? ""}
                onChange={(e) => setValue("category_id", e.target.value)}
              >
                <option value="">{t("documents.noCategory")}</option>
                {categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_fr}
                    </option>
                  ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setShowCatForm((s) => !s)}
                aria-label={t("documents.addCategory")}
              >
                <Plus className="size-4" />
              </Button>
              {watched.category_id ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={onDeleteCategory}
                  disabled={creatingCat}
                  aria-label={t("documents.deleteCategory")}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              ) : null}
            </div>
            {showCatForm ? (
              <div className="mt-2 grid gap-2 rounded-xl p-3 ring-1 ring-foreground/10 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder={t("documents.categoryNamePlaceholder")}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Button type="button" onClick={onCreateCategory} disabled={creatingCat}>
                  {creatingCat ? t("common.saving") : t("categories.add")}
                </Button>
              </div>
            ) : null}
          </div>
          <div>
            <Label htmlFor="d-issue">
              {t("documents.issueDate")}
              {reqMark}
            </Label>
            <Input
              id="d-issue"
              type="date"
              className="mt-1"
              aria-invalid={errors.issue_date ? true : undefined}
              {...register("issue_date")}
            />
            {err(errors.issue_date?.message)}
          </div>
          <div>
            <Label htmlFor="d-validity">{t("documents.validityDate")}</Label>
            <Input id="d-validity" type="date" className="mt-1" {...register("validity_date")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="d-title">{t("documents.docTitle")}</Label>
            <Input id="d-title" className="mt-1" placeholder={t("documents.titlePlaceholder")} {...register("title")} />
            {err(errors.title?.message)}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="d-subject">{t("documents.subject")}</Label>
            <Input id="d-subject" className="mt-1" placeholder={t("documents.subjectPlaceholder")} {...register("subject")} />
          </div>
        </div>
      </section>

      {/* Étape 2 — Client */}
      <section hidden={step !== 1} className="space-y-4">
        <div>
          <Label htmlFor="d-client">
            {t("documents.client")}
            {reqMark}
          </Label>
          <Select
            id="d-client"
            className="mt-1 max-w-md"
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
          <p className="mt-2 text-sm text-muted-foreground">
            {t("documents.clientHint")}{" "}
            <Link
              href="/admin/billing/clients/nouveau"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("documents.createClientLink")}
            </Link>
          </p>

          <div className="mt-4 max-w-md">
            <Label htmlFor="d-clientref">{t("documents.clientRef")}</Label>
            <Input
              id="d-clientref"
              className="mt-1"
              placeholder={t("documents.clientRefPlaceholder")}
              {...register("client_ref")}
            />
          </div>
        </div>
      </section>

      {/* Étape 3 — Corps */}
      <section hidden={step !== 2} className="space-y-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="table" {...register("body_mode")} />
            {t("documents.modeTable")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="text" {...register("body_mode")} />
            {t("documents.modeText")}
          </label>
        </div>

        {bodyMode === "table" ? (
          <div className="space-y-3">
            {/* Défilement horizontal sur mobile : la saisie reste confortable
                sans écraser les colonnes (largeur mini garantie). */}
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      {t("documents.designation")}
                      {reqMark}
                    </th>
                    <th className="w-24 px-3 py-2 font-medium">{t("documents.unit")}</th>
                    <th className="w-20 px-3 py-2 font-medium">{t("documents.quantity")}</th>
                    <th className="w-32 px-3 py-2 font-medium">{t("documents.unitPrice")}</th>
                    <th className="w-32 px-3 py-2 text-right font-medium">{t("documents.lineTotal")}</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, i) => {
                    const qty = Number(watched.lines?.[i]?.quantity) || 0;
                    const pu = Number(watched.lines?.[i]?.unit_price) || 0;
                    return (
                      <tr key={field.id} className="border-t border-border align-top">
                        <td className="px-3 py-2">
                          <Input
                            aria-invalid={
                              errors.lines?.[i]?.designation ? true : undefined
                            }
                            {...register(`lines.${i}.designation` as const)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            placeholder={t("documents.unitPlaceholder")}
                            {...register(`lines.${i}.unit` as const)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            {...register(`lines.${i}.quantity` as const, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...register(`lines.${i}.unit_price` as const, { valueAsNumber: true })}
                          />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatMoney(lineTotal(qty, pu))}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => remove(i)}
                            disabled={fields.length <= 1}
                            aria-label={t("documents.removeLine")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {err(errors.lines?.message)}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ designation: "", unit: "", quantity: 1, unit_price: 0 })}
            >
              <Plus className="size-4" />
              {t("documents.addLine")}
            </Button>
          </div>
        ) : (
          <div>
            <Label htmlFor="d-body">
              {t("documents.bodyText")}
              {reqMark}
            </Label>
            <Textarea
              id="d-body"
              className="mt-1 min-h-48"
              placeholder={t("documents.bodyTextPlaceholder")}
              aria-invalid={errors.body_text ? true : undefined}
              {...register("body_text")}
            />
            {err(errors.body_text?.message)}
          </div>
        )}
      </section>

      {/* Étape 4 — Totaux */}
      <section hidden={step !== 3} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="d-labor">{t("documents.laborAmount")}</Label>
            <Input id="d-labor" type="number" min="0" className="mt-1" aria-invalid={errors.labor_amount ? true : undefined} {...register("labor_amount", { valueAsNumber: true })} />
            {err(errors.labor_amount?.message)}
          </div>
          <div>
            <Label htmlFor="d-discount">{t("documents.discountAmount")}</Label>
            <Input id="d-discount" type="number" min="0" className="mt-1" aria-invalid={errors.discount_amount ? true : undefined} {...register("discount_amount", { valueAsNumber: true })} />
            {err(errors.discount_amount?.message)}
          </div>
          <div>
            <Label htmlFor="d-tax">{t("documents.taxRate")}</Label>
            <Input id="d-tax" type="number" step="0.01" min="0" max="100" className="mt-1" aria-invalid={errors.tax_rate ? true : undefined} {...register("tax_rate", { valueAsNumber: true })} />
            {err(errors.tax_rate?.message)}
            <p className="mt-1 text-xs text-muted-foreground">{t("documents.taxHint")}</p>
          </div>
        </div>

        <div className="ml-auto max-w-xs space-y-1.5 rounded-xl bg-muted/40 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("documents.materialsSubtotal")}</span>
            <span className="tabular-nums">{formatMoney(totals.materialsSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("documents.laborAmount")}</span>
            <span className="tabular-nums">{formatMoney(totals.laborAmount)}</span>
          </div>
          {totals.discountAmount > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("documents.discountAmount")}</span>
              <span className="tabular-nums text-destructive">- {formatMoney(totals.discountAmount)}</span>
            </div>
          ) : null}
          {totals.taxRate > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("documents.tax")} ({totals.taxRate} %)
              </span>
              <span className="tabular-nums">{formatMoney(totals.taxAmount)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
            <span>{t("documents.totalAmount")}</span>
            <span className="tabular-nums">{formatMoney(totals.totalAmount)}</span>
          </div>
        </div>
      </section>

      {/* Étape 5 — Conditions */}
      <section hidden={step !== 4} className="space-y-4">
        <div>
          <Label htmlFor="d-payterms">
            {t("documents.paymentTerms")}
            {conditionsForced ? reqMark : null}
          </Label>
          <Textarea
            id="d-payterms"
            className="mt-1"
            aria-invalid={errors.payment_terms ? true : undefined}
            {...register("payment_terms")}
          />
          {err(errors.payment_terms?.message)}
        </div>
        <div>
          <Label htmlFor="d-delterms">
            {t("documents.deliveryTerms")}
            {conditionsForced ? reqMark : null}
          </Label>
          <Textarea id="d-delterms" className="mt-1" {...register("delivery_terms")} />
        </div>
        <label className="flex items-start gap-2 rounded-xl ring-1 ring-foreground/10 p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            disabled={conditionsForced}
            {...register("include_conditions")}
          />
          <span>
            <span className="font-medium">{t("documents.includeConditions")}</span>
            <span className="mt-0.5 block text-muted-foreground">
              {conditionsForced
                ? t("documents.includeConditionsForced")
                : t("documents.includeConditionsHint")}
            </span>
          </span>
        </label>
        <div>
          <Label htmlFor="d-notes">{t("documents.internalNotes")}</Label>
          <Textarea id="d-notes" className="mt-1" placeholder={t("documents.internalNotesHint")} {...register("notes_internes")} />
        </div>
      </section>

      {/* Navigation + soumission */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {t("common.previous")}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => goToStep(step + 1)}>
            {t("common.next")}
          </Button>
        ) : (
          <Button type="button" onClick={onSaveClick} disabled={pending}>
            {pending ? t("common.saving") : t("documents.saveDraft")}
          </Button>
        )}
      </div>
    </form>
  );
}
