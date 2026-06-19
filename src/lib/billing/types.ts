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
  | "rapport_maintenance"
  | "autre";

export type BodyMode = "table" | "text";

// ───────────── Rapport de maintenance (sections structurées) ─────────────
/** Nature de l'intervention consignée dans le rapport. */
export type InterventionType =
  | "preventive"
  | "corrective"
  | "curative"
  | "installation"
  | "controle";

/** Équipement concerné par l'intervention. */
export interface ReportEquipment {
  designation: string; // ex. « Caméra IP dôme »
  brand_model: string; // marque / modèle
  serial: string; // n° de série
  location: string; // emplacement
}

/** Opération réalisée pendant l'intervention. */
export interface ReportOperation {
  description: string; // opération effectuée
  status: string; // « Réalisée », « Partielle », « À prévoir »…
  duration: string; // durée (ex. « 1h30 »)
}

/** Pièce ou fourniture utilisée. */
export interface ReportPart {
  designation: string;
  quantity: number;
}

/**
 * Contenu structuré d'un rapport de maintenance (stocké en JSONB
 * `documents.report_data`). Aucune logique de montant : un rapport documente
 * une intervention technique, pas une transaction commerciale.
 */
export interface MaintenanceReportData {
  intervention_type: InterventionType;
  site: string; // lieu d'intervention
  intervention_date: string; // date(s) d'intervention (texte libre)
  start_time: string; // heure d'arrivée
  end_time: string; // heure de départ
  technicians: string; // technicien(s) intervenant(s)
  equipments: ReportEquipment[];
  request: string; // objet / motif de l'intervention
  diagnosis: string; // constat / diagnostic
  operations: ReportOperation[];
  parts: ReportPart[];
  tests: string; // tests & vérifications, mesures relevées
  conformity: string; // « Conforme », « Non conforme », « Avec réserves »
  observations: string; // observations & recommandations
  final_state: string; // état final (opérationnel, partiel, hors service)
  next_maintenance: string; // prochaine maintenance recommandée
}

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
  report_data: MaintenanceReportData | null; // sections du rapport (type rapport_maintenance)
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
