"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import {
  documentSchema,
  customDocumentTypeSchema,
  type DocumentInput,
} from "@/lib/billing/validation";
import { computeTotals, lineTotal } from "@/lib/billing/compute";
import { canTransition, timestampField } from "@/lib/billing/status-machine";
import type { DocumentStatus, CustomDocumentType } from "@/lib/billing/types";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Mode d'affichage effectif : une facture utilise toujours le tableau. */
function effectiveBodyMode(input: DocumentInput): "table" | "text" {
  return input.type === "facture" ? "table" : input.body_mode;
}

/**
 * Construit le JSONB `invoice_data` (facture uniquement). Les montants sont des
 * entiers FCFA ; le calcul du solde/net est refait au rendu (source unique).
 */
function buildInvoiceData(input: DocumentInput) {
  if (input.type !== "facture") return null;
  const inv = input.invoice;
  if (!inv) return null;
  const round = (n: number | null | undefined) => Math.round(Number(n) || 0);
  return {
    kind: inv.kind,
    payment_method: inv.payment_method ?? "",
    devis_ref: (inv.devis_ref ?? "").trim(),
    advance_percent:
      inv.advance_percent === null || inv.advance_percent === undefined
        ? null
        : Number(inv.advance_percent),
    advance_amount: inv.kind === "acompte" ? round(inv.advance_amount) : 0,
    deductions:
      inv.kind === "definitive"
        ? inv.deductions.map((d) => ({
            reference: d.reference.trim(),
            date: (d.date ?? "").trim(),
            amount: round(d.amount),
          }))
        : [],
  };
}

/** Construit les lignes à insérer (mode tableau uniquement). */
function buildLines(documentId: string, input: DocumentInput) {
  if (effectiveBodyMode(input) !== "table") return [];
  return input.lines.map((l, index) => ({
    document_id: documentId,
    position: index,
    designation: l.designation.trim(),
    unit: nz(l.unit),
    quantity: Number(l.quantity) || 0,
    unit_price: Math.round(Number(l.unit_price) || 0),
    line_total: lineTotal(l.quantity, l.unit_price),
  }));
}

/**
 * Crée un document (brouillon) avec ses lignes.
 * Le numéro et le share_token sont générés automatiquement par les triggers DB.
 */
export async function createDocument(values: DocumentInput): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  const totals = computeTotals(v);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      client_id: v.client_id,
      category_id: nz(v.category_id),
      // Un type personnalisé est stocké en type="autre" + custom_type_id.
      type: nz(v.custom_type_id) ? "autre" : v.type,
      custom_type_id: nz(v.custom_type_id),
      issue_date: v.issue_date,
      validity_date: nz(v.validity_date),
      title: nz(v.title),
      subject: nz(v.subject),
      client_ref: nz(v.client_ref),
      body_mode: effectiveBodyMode(v),
      body_text: effectiveBodyMode(v) === "text" ? nz(v.body_text) : null,
      // Sections du rapport (uniquement pour un rapport de maintenance).
      report_data: v.type === "rapport_maintenance" ? (v.report ?? null) : null,
      // Partie règlement/acompte (uniquement pour une facture).
      invoice_data: buildInvoiceData(v),
      materials_subtotal: totals.materialsSubtotal,
      labor_amount: totals.laborAmount,
      discount_amount: totals.discountAmount,
      tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      payment_terms: nz(v.payment_terms),
      delivery_terms: nz(v.delivery_terms),
      // Encadré de conditions forcé pour un bon de commande et une facture.
      include_conditions:
        v.type === "bon_commande" || v.type === "facture"
          ? true
          : v.include_conditions,
      notes_internes: nz(v.notes_internes),
      status: "brouillon",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  const lines = buildLines(data.id, v);
  if (lines.length > 0) {
    const { error: linesError } = await supabase.from("document_lines").insert(lines);
    if (linesError) return { ok: false, error: linesError.message };
  }

  revalidatePath("/admin/billing/documents");
  return { ok: true, id: data.id };
}

/**
 * Met à jour un document et remplace l'intégralité de ses lignes.
 * (Stratégie simple : delete + insert des lignes — suffisant en Phase 2.)
 */
export async function updateDocument(
  id: string,
  values: DocumentInput,
): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  const totals = computeTotals(v);

  const { error } = await supabase
    .from("documents")
    .update({
      client_id: v.client_id,
      category_id: nz(v.category_id),
      // Un type personnalisé est stocké en type="autre" + custom_type_id.
      type: nz(v.custom_type_id) ? "autre" : v.type,
      custom_type_id: nz(v.custom_type_id),
      issue_date: v.issue_date,
      validity_date: nz(v.validity_date),
      title: nz(v.title),
      subject: nz(v.subject),
      client_ref: nz(v.client_ref),
      body_mode: effectiveBodyMode(v),
      body_text: effectiveBodyMode(v) === "text" ? nz(v.body_text) : null,
      // Sections du rapport (uniquement pour un rapport de maintenance).
      report_data: v.type === "rapport_maintenance" ? (v.report ?? null) : null,
      // Partie règlement/acompte (uniquement pour une facture).
      invoice_data: buildInvoiceData(v),
      materials_subtotal: totals.materialsSubtotal,
      labor_amount: totals.laborAmount,
      discount_amount: totals.discountAmount,
      tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      payment_terms: nz(v.payment_terms),
      delivery_terms: nz(v.delivery_terms),
      // Encadré de conditions forcé pour un bon de commande et une facture.
      include_conditions:
        v.type === "bon_commande" || v.type === "facture"
          ? true
          : v.include_conditions,
      notes_internes: nz(v.notes_internes),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Remplace les lignes
  await supabase.from("document_lines").delete().eq("document_id", id);
  const lines = buildLines(id, v);
  if (lines.length > 0) {
    const { error: linesError } = await supabase.from("document_lines").insert(lines);
    if (linesError) return { ok: false, error: linesError.message };
  }

  revalidatePath("/admin/billing/documents");
  revalidatePath(`/admin/billing/documents/${id}`);
  return { ok: true, id };
}

const STATUS_VALUES: DocumentStatus[] = [
  "brouillon",
  "envoye",
  "confirme",
  "termine",
  "annule",
];

/**
 * Change le statut d'un document en respectant la machine d'états.
 * Pose le timestamp correspondant (sent_at/confirmed_at/…) si ce n'est pas
 * déjà fait. Le trigger DB met à jour category_stats au passage « terminé ».
 */
export async function changeDocumentStatus(
  id: string,
  to: DocumentStatus,
): Promise<ActionResult> {
  if (!STATUS_VALUES.includes(to)) {
    return { ok: false, error: "Statut invalide." };
  }

  await requireProfile();
  const supabase = await createSupabaseServerClient();

  // Récupère le statut courant pour valider la transition côté serveur.
  const { data: current, error: readError } = await supabase
    .from("documents")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!current) return { ok: false, error: "Document introuvable." };

  const from = current.status as DocumentStatus;
  if (from === to) return { ok: true, id };

  if (!canTransition(from, to)) {
    return { ok: false, error: "Transition de statut non autorisée." };
  }

  // Prépare la mise à jour : statut + timestamp daté (si pas déjà posé).
  const patch: Record<string, unknown> = { status: to };
  const field = timestampField(to);
  if (field) {
    patch[field] = new Date().toISOString();
  }

  const { error } = await supabase.from("documents").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/documents");
  revalidatePath(`/admin/billing/documents/${id}`);
  return { ok: true, id };
}

export type CreateCustomTypeResult =
  | { ok: true; customType: CustomDocumentType }
  | { ok: false; error: string };

/**
 * Crée un type de document personnalisé (ex. « Attestation » / « ATT »).
 * Renvoie l'objet créé pour que le formulaire l'ajoute à la liste et le
 * sélectionne immédiatement.
 */
export async function createCustomType(values: {
  name: string;
  prefix: string;
}): Promise<CreateCustomTypeResult> {
  const parsed = customDocumentTypeSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  // Place le nouveau type en fin de liste.
  const { count } = await supabase
    .from("document_types")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("document_types")
    .insert({
      organization_id: profile.organization_id,
      name: v.name,
      prefix: v.prefix,
      order: (count ?? 0) + 1,
      active: true,
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/documents/nouveau");
  return { ok: true, customType: data as CustomDocumentType };
}

/**
 * Supprime un type de document personnalisé.
 * Les documents qui l'utilisaient voient leur `custom_type_id` mis à NULL
 * (ON DELETE SET NULL) : ils ne sont pas supprimés, ils perdent juste ce type.
 */
export async function deleteCustomType(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("document_types").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/documents/nouveau");
  return { ok: true };
}

/** Supprime un document (les lignes partent en cascade via la FK). */
export async function deleteDocument(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/documents");
  return { ok: true };
}
