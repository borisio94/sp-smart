import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Client,
  Category,
  BillingDocument,
  DocumentLine,
  Organization,
  Payment,
  CustomDocumentType,
} from "./types";

/**
 * Requêtes de lecture du module Billing (Server Components).
 * Toutes passent par le client serveur scoupé RLS : seules les données de
 * l'organisation de l'utilisateur authentifié sont visibles.
 */

// ───────────── Organisation ─────────────
export async function getOrganization(): Promise<Organization | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("organizations").select("*").maybeSingle();
  return (data as Organization | null) ?? null;
}

// ───────────── Clients ─────────────
export async function listClients(search?: string): Promise<Client[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("clients").select("*").order("name", { ascending: true });
  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  const { data } = await query;
  return (data as Client[] | null) ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return (data as Client | null) ?? null;
}

// ───────────── Catégories ─────────────
export async function listCategories(onlyActive = false): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("categories").select("*").order("order", { ascending: true });
  if (onlyActive) query = query.eq("active", true);
  const { data } = await query;
  return (data as Category[] | null) ?? [];
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  return (data as Category | null) ?? null;
}

// ───────────── Types de documents personnalisés ─────────────
export async function listCustomDocumentTypes(
  onlyActive = false,
): Promise<CustomDocumentType[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("document_types")
    .select("*")
    .order("order", { ascending: true })
    .order("name", { ascending: true });
  if (onlyActive) query = query.eq("active", true);
  const { data } = await query;
  return (data as CustomDocumentType[] | null) ?? [];
}

// ───────────── Documents ─────────────
export interface DocumentFilters {
  type?: string;
  status?: string;
  payment_status?: string;
  category_id?: string;
  client_id?: string;
  search?: string;
}

/** Document enrichi du nom de client et de catégorie (pour la liste). */
export interface DocumentListItem extends BillingDocument {
  client: { name: string } | null;
  category: { name_fr: string } | null;
  custom_type: { name: string; prefix: string } | null;
}

export async function listDocuments(
  filters: DocumentFilters = {},
): Promise<DocumentListItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("documents")
    .select(
      "*, client:clients(name), category:categories(name_fr), custom_type:document_types(name, prefix)",
    )
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.payment_status) query = query.eq("payment_status", filters.payment_status);
  if (filters.category_id) query = query.eq("category_id", filters.category_id);
  if (filters.client_id) query = query.eq("client_id", filters.client_id);
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    query = query.or(`number.ilike.%${s}%,title.ilike.%${s}%,subject.ilike.%${s}%`);
  }

  const { data } = await query;
  return (data as DocumentListItem[] | null) ?? [];
}

/** Document complet avec ses lignes (pour le détail/édition). */
export interface DocumentWithLines extends BillingDocument {
  lines: DocumentLine[];
  client: Client | null;
  category: Category | null;
  custom_type: { name: string; prefix: string } | null;
}

export async function getDocument(id: string): Promise<DocumentWithLines | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "*, lines:document_lines(*), client:clients(*), category:categories(*), custom_type:document_types(name, prefix)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const doc = data as DocumentWithLines;
  // Ordonne les lignes par position
  doc.lines = (doc.lines ?? []).sort((a, b) => a.position - b.position);
  return doc;
}

// ───────────── Paiements ─────────────
/** Paiements d'un document, du plus récent au plus ancien. */
export async function listPayments(documentId: string): Promise<Payment[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("document_id", documentId)
    .order("received_at", { ascending: false })
    .order("created_at", { ascending: false });
  return (data as Payment[] | null) ?? [];
}

/** Paiement enrichi du document et du client (suivi global). */
export interface PaymentListItem extends Payment {
  document: {
    id: string;
    number: string | null;
    type: BillingDocument["type"];
    client: { name: string } | null;
  } | null;
}

/** Derniers paiements toutes factures confondues. */
export async function listRecentPayments(limit = 50): Promise<PaymentListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "*, document:documents(id, number, type, client:clients(name))",
    )
    .order("received_at", { ascending: false })
    .limit(limit);
  return (data as PaymentListItem[] | null) ?? [];
}

/** Factures non soldées (statut de paiement ≠ payé/remboursé). */
export async function listUnpaidInvoices(): Promise<DocumentListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("documents")
    .select("*, client:clients(name), category:categories(name_fr)")
    .eq("type", "facture")
    .in("payment_status", ["non_paye", "acompte", "partiel"])
    .order("issue_date", { ascending: true });
  return (data as DocumentListItem[] | null) ?? [];
}
