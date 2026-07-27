"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import {
  documentSchema,
  customDocumentTypeSchema,
  type DocumentInput,
} from "@/lib/billing/validation";
import { computeTotals, resolveLineTotal } from "@/lib/billing/compute";
import { formatDate } from "@/lib/billing/format";
import { canTransition, timestampField } from "@/lib/billing/status-machine";
import type { DocumentStatus, CustomDocumentType } from "@/lib/billing/types";

/** Client Supabase serveur (type retourné par le helper). */
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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
    section: nz(l.section),
    designation: l.designation.trim(),
    unit: l.is_amount_only ? null : nz(l.unit),
    quantity: l.is_amount_only ? 1 : Number(l.quantity) || 0,
    unit_price: Math.round(Number(l.unit_price) || 0),
    is_amount_only: Boolean(l.is_amount_only),
    line_total: resolveLineTotal(l),
  }));
}

/**
 * Champs de signature à écrire lors d'une édition.
 *
 * Une signature client porte sur un contenu précis (c'est le sens de
 * `signature_doc_hash`). Modifier le document après coup ferait mentir le PDF,
 * qui continuerait d'afficher « Signé électroniquement par … » à côté d'un
 * contenu que le client n'a jamais accepté. On annule donc la signature dès
 * qu'un document signé est réenregistré : `signature_required` reste actif, le
 * document repasse simplement « en attente de signature ».
 *
 * Renvoie un objet vide si le document n'était pas signé (cas courant).
 */
async function signatureResetOnEdit(
  supabase: ServerClient,
  id: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from("documents")
    .select("signed_at")
    .eq("id", id)
    .maybeSingle();

  if (!data?.signed_at) return {};

  return {
    signed_at: null,
    signed_by_name: null,
    signed_by_email: null,
    client_signature_url: null,
    signature_ip: null,
    signature_user_agent: null,
    signature_doc_hash: null,
  };
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
      // Forcé côté serveur pour un bon de commande (zone non désactivable).
      include_conditions: v.type === "bon_commande" ? true : v.include_conditions,
      // Signature en ligne proposée au client : choix de l'émetteur, quel que
      // soit le type de document.
      signature_required: v.signature_required,
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
  const signatureReset = await signatureResetOnEdit(supabase, id);

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
      // Forcé côté serveur pour un bon de commande (zone non désactivable).
      include_conditions: v.type === "bon_commande" ? true : v.include_conditions,
      // Signature en ligne proposée au client : choix de l'émetteur, quel que
      // soit le type de document.
      signature_required: v.signature_required,
      notes_internes: nz(v.notes_internes),
      // Une édition invalide la signature déjà apposée (cf. signatureResetOnEdit).
      ...signatureReset,
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

// ───────────── Factures (page dédiée) ─────────────
/** Réf. lisible d'une cotation : « DEV-2026-0001 du 12/03/2026 ». */
function buildDevisRef(number: string | null, issueDate: string | null): string {
  const num = (number ?? "").trim();
  const date = issueDate ? formatDate(issueDate) : "";
  if (num && date) return `${num} du ${date}`;
  return num || date || "";
}

/**
 * Résout la cotation liée à une facture. Si une cotation existante est
 * sélectionnée on l'utilise ; sinon on crée automatiquement un devis (même
 * client / objet / montant) et on lie la facture à ce devis. Une facture est
 * ainsi TOUJOURS rattachée à une pièce de cotation.
 */
async function resolveLinkedQuotation(
  supabase: ServerClient,
  profile: { id: string; organization_id: string },
  v: DocumentInput,
  totals: ReturnType<typeof computeTotals>,
): Promise<{ linkedId: string; devisRef: string } | { error: string }> {
  const existingId = nz(v.linked_document_id);
  if (existingId) {
    const { data: q, error } = await supabase
      .from("documents")
      .select("id, number, issue_date")
      .eq("id", existingId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!q) return { error: "Cotation liée introuvable." };
    return { linkedId: q.id, devisRef: buildDevisRef(q.number, q.issue_date) };
  }

  // Aucune cotation existante → création automatique d'un devis lié.
  const { data: devis, error } = await supabase
    .from("documents")
    .insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      client_id: v.client_id,
      category_id: nz(v.category_id),
      type: "devis",
      issue_date: v.issue_date,
      title: nz(v.title),
      subject: nz(v.subject),
      client_ref: nz(v.client_ref),
      body_mode: "table",
      materials_subtotal: totals.materialsSubtotal,
      labor_amount: totals.laborAmount,
      discount_amount: totals.discountAmount,
      tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      status: "brouillon",
    })
    .select("id, number, issue_date")
    .single();
  if (error) return { error: error.message };

  const lines = buildLines(devis.id, v);
  if (lines.length > 0) {
    const { error: linesError } = await supabase.from("document_lines").insert(lines);
    if (linesError) return { error: linesError.message };
  }
  return { linkedId: devis.id, devisRef: buildDevisRef(devis.number, devis.issue_date) };
}

/** Crée une facture (rattachée à une cotation existante ou auto-créée). */
export async function createFacture(values: DocumentInput): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  if (v.type !== "facture") return { ok: false, error: "Type de document invalide." };
  const totals = computeTotals(v);

  const linked = await resolveLinkedQuotation(supabase, profile, v, totals);
  if ("error" in linked) return { ok: false, error: linked.error };

  const invoiceData = buildInvoiceData(v);
  if (invoiceData) invoiceData.devis_ref = linked.devisRef;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      client_id: v.client_id,
      category_id: nz(v.category_id),
      type: "facture",
      issue_date: v.issue_date,
      title: nz(v.title),
      subject: nz(v.subject),
      client_ref: nz(v.client_ref),
      body_mode: "table",
      invoice_data: invoiceData,
      materials_subtotal: totals.materialsSubtotal,
      labor_amount: totals.laborAmount,
      discount_amount: totals.discountAmount,
      tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      payment_terms: nz(v.payment_terms),
      delivery_terms: nz(v.delivery_terms),
      include_conditions: v.include_conditions,
      signature_required: v.signature_required,
      notes_internes: nz(v.notes_internes),
      linked_document_id: linked.linkedId,
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

/** Met à jour une facture (relie une cotation, conserve le lien existant sinon). */
export async function updateFacture(
  id: string,
  values: DocumentInput,
): Promise<ActionResult> {
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  if (v.type !== "facture") return { ok: false, error: "Type de document invalide." };
  const totals = computeTotals(v);

  let linkedId = nz(v.linked_document_id);
  let devisRef = "";
  if (linkedId) {
    const { data: q } = await supabase
      .from("documents")
      .select("id, number, issue_date")
      .eq("id", linkedId)
      .maybeSingle();
    if (!q) return { ok: false, error: "Cotation liée introuvable." };
    devisRef = buildDevisRef(q.number, q.issue_date);
  } else {
    // Aucune cotation sélectionnée : on garde le lien courant s'il existe,
    // sinon on crée un devis (évite d'en générer un à chaque édition).
    const { data: cur } = await supabase
      .from("documents")
      .select("linked_document_id")
      .eq("id", id)
      .maybeSingle();
    const currentLink = (cur?.linked_document_id as string | null) ?? null;
    if (currentLink) {
      const { data: q } = await supabase
        .from("documents")
        .select("id, number, issue_date")
        .eq("id", currentLink)
        .maybeSingle();
      linkedId = currentLink;
      devisRef = q ? buildDevisRef(q.number, q.issue_date) : "";
    } else {
      const linked = await resolveLinkedQuotation(supabase, profile, v, totals);
      if ("error" in linked) return { ok: false, error: linked.error };
      linkedId = linked.linkedId;
      devisRef = linked.devisRef;
    }
  }

  const invoiceData = buildInvoiceData(v);
  if (invoiceData) invoiceData.devis_ref = devisRef;
  const signatureReset = await signatureResetOnEdit(supabase, id);

  const { error } = await supabase
    .from("documents")
    .update({
      client_id: v.client_id,
      category_id: nz(v.category_id),
      issue_date: v.issue_date,
      title: nz(v.title),
      subject: nz(v.subject),
      client_ref: nz(v.client_ref),
      body_mode: "table",
      invoice_data: invoiceData,
      materials_subtotal: totals.materialsSubtotal,
      labor_amount: totals.laborAmount,
      discount_amount: totals.discountAmount,
      tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount,
      total_amount: totals.totalAmount,
      payment_terms: nz(v.payment_terms),
      delivery_terms: nz(v.delivery_terms),
      include_conditions: v.include_conditions,
      signature_required: v.signature_required,
      notes_internes: nz(v.notes_internes),
      linked_document_id: linkedId || null,
      // Une édition invalide la signature déjà apposée (cf. signatureResetOnEdit).
      ...signatureReset,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

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
