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
  | "en_cours"
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

// ───────────── Facture (acompte / définitive) ─────────────
/**
 * Nature d'une facture :
 *  - « acompte »    : facture d'acompte (avance sur travaux, avec récapitulatif
 *                     marché / acompte versé / solde restant).
 *  - « definitive » : facture définitive ou de solde (déduction des acomptes
 *                     déjà versés → net à payer).
 */
export type FactureKind = "acompte" | "definitive";

/** Acompte déduit sur une facture définitive (référence de la facture d'acompte). */
export interface InvoiceDeduction {
  reference: string; // n° de la facture d'acompte (ex. « FAC-2026-0001 »)
  date: string; // date de versement (libre, ex. « 12/03/2026 »)
  amount: number; // montant déduit (positif, affiché en négatif)
}

/**
 * Contenu spécifique d'une facture (stocké en JSONB `documents.invoice_data`).
 * Le corps commercial (tableau, totaux, taxe) reste porté par les colonnes
 * habituelles ; `invoice_data` ne décrit que la partie règlement/acompte.
 */
export interface InvoiceData {
  kind: FactureKind;
  payment_method: PaymentMethod | ""; // mode de règlement affiché ("" = non précisé)
  devis_ref: string; // référence du devis d'origine (texte libre)
  advance_percent: number | null; // acompte : pourcentage du marché (affichage/calcul)
  advance_amount: number; // acompte : montant versé ce jour (FCFA)
  deductions: InvoiceDeduction[]; // facture définitive : acomptes déduits
}

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
  niu: string | null; // numéro identifiant unique fiscal (si entreprise)
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
  section: string | null; // intitulé du compartiment (NULL = hors section)
  designation: string;
  unit: string | null; // « pièce », « barre », « m », « paire »…
  quantity: number;
  unit_price: number;
  is_amount_only: boolean; // ligne forfaitaire (montant direct, sans qté/PU)
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
  invoice_data: InvoiceData | null; // partie règlement/acompte (type facture)
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
  market_phase: MarketPhase; // travaux du marché ou intervention après-vente
  is_historical: boolean;
  include_signature: boolean;
  include_conditions: boolean; // affiche l'encadré « conditions » dans le PDF
  // ── Signature électronique du client (lien privé) ──
  signature_required: boolean; // proposer la signature sur la page publique
  signed_at: string | null; // horodatage serveur de la signature
  signed_by_name: string | null; // identité déclarée par le signataire
  signed_by_email: string | null;
  client_signature_url: string | null; // PNG du tracé (bucket privé « signatures »)
  signature_ip: string | null;
  signature_user_agent: string | null;
  signature_doc_hash: string | null; // SHA-256 du contenu signé (intégrité)
  notes_internes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  confirmed_at: string | null;
  started_at: string | null; // démarrage du chantier (statut « en cours »)
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

// ───────────── Trésorerie / Caisse ─────────────
/** Sens d'un mouvement de caisse : entrée (encaissement) ou dépense. */
export type MovementDirection = "in" | "out";

/**
 * Origine d'un mouvement de caisse.
 *  - `manuel`   : saisi à la main dans la caisse
 *  - `marche`   : versement du net d'un marché (document_id = la cotation)
 *  - `paiement` : hérité de l'ancien trigger paiement→caisse (désactivé en 0020)
 */
export type MovementSource = "manuel" | "marche" | "paiement";

/** Réglages de caisse (singleton par organisation). */
export interface CashSettings {
  organization_id: string;
  opening_balance: number; // fonds initial disponible (FCFA)
  red_line: number; // ligne rouge / seuil minimum (FCFA)
  opening_note: string | null;
  updated_at: string;
}

/** Catégorie de dépense (gérable par l'utilisateur). */
export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  color: string | null;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Mouvement de caisse (entrée ou dépense). */
export interface CashMovement {
  id: string;
  organization_id: string;
  created_by: string | null;
  direction: MovementDirection;
  amount: number; // montant positif (FCFA)
  occurred_at: string;
  description: string | null;
  category_id: string | null;
  document_id: string | null;
  payment_id: string | null; // renseigné si issu d'un paiement de facture
  method: string | null;
  reference: string | null;
  source: MovementSource; // origine du mouvement (saisie, marché, ancien trigger)
  created_at: string;
}

/** Synthèse de caisse : solde courant et marge avant la ligne rouge. */
export interface CashOverview {
  openingBalance: number;
  redLine: number;
  balance: number; // solde courant
  margin: number; // marge avant la ligne rouge (balance − redLine)
  totalIn: number; // total des entrées
  totalOut: number; // total des dépenses
  monthIn: number; // entrées du mois courant
  monthOut: number; // dépenses du mois courant
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

// ───────────── Marché : charges internes & versement en caisse ─────────────
/**
 * Charge interne d'un marché (achat de matériel, transport, main d'œuvre…).
 * Rattachée à la COTATION qui porte le marché, jamais à une facture.
 * Ne quitte jamais l'administration : ni PDF client, ni lien privé.
 */
/**
 * Phase d'un marché.
 *  - `travaux` : le chantier initial, celui que le devis a vendu
 *  - `panne`   : une intervention après-vente, postérieure à la livraison
 *
 * Séparer les deux garde lisible la rentabilité du chantier d'origine :
 * sans cela, une réparation sous garantie amputerait sa marge.
 */
export type MarketPhase = "travaux" | "panne";

export interface MarketExpense {
  id: string;
  organization_id: string;
  document_id: string; // la cotation (devis / proforma / bon de commande)
  created_by: string | null;
  reason: string; // raison de la charge (obligatoire)
  phase: MarketPhase; // travaux du chantier ou intervention après-vente
  amount: number; // montant positif (FCFA)
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

/** Versement du net d'un marché vers la caisse (mouvement `source = marche`). */
export interface MarketPayout {
  id: string;
  amount: number;
  occurred_at: string;
  description: string | null;
  method: string | null;
  reference: string | null;
}

/**
 * Synthèse financière d'un marché, en trois niveaux de lecture (cf. 0021).
 *
 *  1. TRAVAUX     — le chantier vendu par le devis :
 *                   total du marché − charges de travaux = marge du chantier
 *  2. APRÈS-VENTE — les interventions postérieures (pannes) :
 *                   encaissé pannes − charges pannes = résultat SAV
 *  3. CUMUL       — marge du chantier + résultat SAV
 *
 * Les deux premiers restent séparés pour qu'une réparation sous garantie ne
 * vienne jamais masquer la rentabilité réelle du chantier d'origine.
 *
 * Le DISPONIBLE, lui, ignore cette distinction : l'argent en caisse est le
 * même, d'où qu'il vienne. C'est lui — et jamais la marge — qui plafonne un
 * versement, car la marge d'un marché à moitié réglé n'existe pas encore.
 */
export interface MarketOverview {
  // ── 1. Travaux ──
  marketTotal: number; // montant total de la cotation
  worksCollected: number; // encaissé sur le marché (hors après-vente)
  worksExpenses: number; // charges de phase « travaux »
  worksMargin: number; // marketTotal − worksExpenses (peut être négatif)

  // ── 2. Après-vente ──
  afterSalesCollected: number; // encaissé sur les factures de panne
  afterSalesExpenses: number; // charges de phase « panne »
  afterSalesResult: number; // afterSalesCollected − afterSalesExpenses
  afterSalesCount: number; // nombre de factures d'intervention

  // ── 3. Cumul & trésorerie ──
  totalMargin: number; // worksMargin + afterSalesResult
  collectedTotal: number; // tout ce que le client a versé (travaux + pannes)
  expensesTotal: number; // toutes les charges confondues
  available: number; // collectedTotal − expensesTotal (négatif = avance de trésorerie)
  paidOut: number; // déjà versé en caisse depuis ce marché
  remainingToPayOut: number; // available − paidOut (plafond d'un nouveau versement)

  expenses: MarketExpense[];
  payouts: MarketPayout[];
}

// ───────────── Contrat de maintenance ─────────────
/** Rythme de facturation d'un contrat de maintenance. */
export type MaintenancePeriodicity =
  | "mensuel"
  | "trimestriel"
  | "semestriel"
  | "annuel";

/**
 * Contrat de maintenance attaché à un chantier — un seul par marché : le
 * renouvellement repousse l'échéance au lieu d'empiler les lignes.
 */
export interface MaintenanceContract {
  document_id: string; // la cotation (le chantier couvert)
  organization_id: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null; // échéance
  amount: number; // montant du contrat (FCFA)
  periodicity: MaintenancePeriodicity;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
