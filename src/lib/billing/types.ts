/**
 * Types partagés du module Billing — miroir TypeScript du schéma Supabase
 * (cf. supabase/migrations/). Utilisés côté serveur et client.
 * Aucune valeur en dur : ces types décrivent uniquement la forme des données.
 */

// ───────────── Énumérations (alignées sur les types Postgres) ─────────────
export type UserRole = "admin" | "manager" | "viewer";

export type ClientType = "particulier" | "entreprise" | "institution";

export type DocumentType =
  | "devis"
  | "proforma"
  | "bon_commande"
  | "facture"
  | "recu"
  | "autre";

export type BodyMode = "table" | "text";

export type DocumentStatus =
  | "brouillon"
  | "envoye"
  | "confirme"
  | "termine"
  | "annule";

export type PaymentStatus =
  | "non_paye"
  | "acompte"
  | "partiel"
  | "paye_total"
  | "rembourse";

export type PaymentMethod =
  | "especes"
  | "momo_mtn"
  | "momo_orange"
  | "virement"
  | "cheque"
  | "carte";

// ───────────── Tables ─────────────
export interface Organization {
  id: string;
  name: string;
  legal_form: string | null;
  slogan: string | null; // sous-titre affiché dans l'en-tête PDF
  niu: string | null;
  rccm: string | null;
  capital: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null; // pied de page PDF
  bank_name: string | null;
  bank_account: string | null;
  bank_bic: string | null;
  momo_mtn: string | null;
  momo_orange: string | null;
  logo_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  fiscal_regime: string | null;
  default_payment_terms: string | null;
  default_delivery_terms: string | null;
  default_tax_rate: number; // taux de taxe/IR proposé par défaut (%)
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  ref: string | null; // code client auto-généré (CLI-2026-0001)
  name: string;
  type: ClientType;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Type de document personnalisé créé par l'utilisateur (ex. « Attestation »). */
export interface CustomDocumentType {
  id: string;
  organization_id: string;
  name: string;
  prefix: string;
  color: string | null;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  organization_id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  lucide_icon: string | null;
  color: string | null;
  order: number;
  active: boolean;
  created_at: string;
}

export interface DocumentLine {
  id: string;
  document_id: string;
  position: number;
  designation: string;
  unit: string | null; // « pièce », « barre », « m », « paire »…
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface BillingDocument {
  id: string;
  organization_id: string;
  client_id: string | null;
  category_id: string | null;
  created_by: string | null;
  type: DocumentType;
  custom_type_id: string | null; // type personnalisé (si type = "autre")
  number: string | null;
  year: number;
  sequence: number | null;
  issue_date: string;
  validity_date: string | null;
  title: string | null;
  subject: string | null;
  client_ref: string | null; // « Réf client »
  body_mode: BodyMode;
  body_text: string | null;
  materials_subtotal: number;
  labor_amount: number;
  discount_amount: number;
  tax_rate: number; // taux de taxe / IR en %
  tax_amount: number; // montant de taxe calculé (FCFA)
  total_amount: number;
  amount_in_words: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  status: DocumentStatus;
  payment_status: PaymentStatus;
  share_token: string;
  pdf_url: string | null;
  linked_document_id: string | null;
  is_historical: boolean;
  include_signature: boolean;
  include_conditions: boolean; // affiche l'encadré « conditions » dans le PDF
  notes_internes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface Payment {
  id: string;
  document_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  received_at: string;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface CategoryStats {
  category_id: string;
  realized_count: number;
  total_revenue: number;
  updated_at: string;
}

/** Forme renvoyée par la fonction publique get_public_category_stats(). */
export interface PublicCategoryStat {
  slug: string;
  name_fr: string;
  name_en: string;
  lucide_icon: string | null;
  realized_count: number;
}
