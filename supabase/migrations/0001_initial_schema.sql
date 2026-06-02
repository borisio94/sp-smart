-- ============================================================================
--  Module Billing SP Smart Sarl — 0001 : Schéma initial
-- ----------------------------------------------------------------------------
--  Tables, types énumérés et index du module de gestion commerciale.
--  À appliquer en PREMIER (avant triggers, RLS et seed).
--  Idempotent autant que possible (IF NOT EXISTS / DO $$ garde).
-- ============================================================================

-- Extensions nécessaires (UUID, etc.)
create extension if not exists "pgcrypto";

-- ───────────────────────── Types énumérés ─────────────────────────
-- On encapsule chaque création dans un bloc pour rester ré-exécutable.
do $$ begin
  create type public.user_role as enum ('admin', 'manager', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_type as enum ('particulier', 'entreprise', 'institution');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum ('devis', 'proforma', 'bon_commande', 'facture', 'recu');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.body_mode as enum ('table', 'text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_status as enum ('brouillon', 'envoye', 'confirme', 'termine', 'annule');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('non_paye', 'acompte', 'partiel', 'paye_total', 'rembourse');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('especes', 'momo_mtn', 'momo_orange', 'virement', 'cheque', 'carte');
exception when duplicate_object then null; end $$;

-- ───────────────────────── organizations ─────────────────────────
-- Singleton SP Smart (structure prête pour un futur multi-tenant).
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  legal_form    text,                 -- ex : "SARL"
  niu           text,                 -- numéro identifiant unique fiscal
  rccm          text,                 -- registre du commerce
  capital       text,                 -- capital social (texte, ex "1 000 000")
  address       text,
  phone         text,
  email         text,
  website       text,
  bank_name     text,
  bank_account  text,
  bank_bic      text,
  momo_mtn      text,
  momo_orange   text,
  logo_url      text,                 -- Supabase Storage (bucket branding)
  signature_url text,
  stamp_url     text,
  fiscal_regime text default 'simplifie',
  -- Templates réutilisés à la création d'un document (paramètres) :
  default_payment_terms  text,
  default_delivery_terms text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ───────────────────────── profiles ─────────────────────────
-- Lié à auth.users (Supabase Auth). Un profil = un utilisateur admin.
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  full_name       text,
  role            public.user_role not null default 'viewer',
  created_at      timestamptz not null default now()
);
create index if not exists idx_profiles_org on public.profiles (organization_id);

-- ───────────────────────── clients ─────────────────────────
create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  type            public.client_type not null default 'particulier',
  email           text,
  phone           text,
  whatsapp        text,
  address         text,
  contact_person  text,               -- si entreprise/institution
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_clients_org on public.clients (organization_id);

-- ───────────────────────── categories ─────────────────────────
-- Catégories d'exécution paramétrables (alimentent le compteur public).
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug            text not null,
  name_fr         text not null,
  name_en         text not null,
  lucide_icon     text,
  color           text,
  "order"         int not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, slug)
);
create index if not exists idx_categories_org on public.categories (organization_id);

-- ───────────────────────── documents ─────────────────────────
-- Cœur du module : devis, proforma, bon de commande, facture, reçu.
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  client_id         uuid references public.clients (id) on delete set null,
  category_id       uuid references public.categories (id) on delete set null,
  created_by        uuid references public.profiles (id) on delete set null,

  type              public.document_type not null,
  number            text,                       -- ex PRO-2026-0142 (généré ou manuel)
  year              int not null default extract(year from now()),
  sequence          int,                        -- séquence interne (par type+année)

  issue_date        date not null default current_date,
  validity_date     date,                       -- nullable selon type

  title             text,
  subject           text,
  body_mode         public.body_mode not null default 'table',
  body_text         text,

  materials_subtotal numeric(12,0) not null default 0,
  labor_amount       numeric(12,0) not null default 0,
  discount_amount    numeric(12,0) not null default 0,
  total_amount       numeric(12,0) not null default 0,
  amount_in_words    text,                       -- généré app-side (Phase 3)

  payment_terms     text,
  delivery_terms    text,

  status            public.document_status not null default 'brouillon',
  payment_status    public.payment_status not null default 'non_paye',

  share_token       uuid not null default gen_random_uuid(),
  pdf_url           text,
  linked_document_id uuid references public.documents (id) on delete set null,
  is_historical     boolean not null default false,
  include_signature boolean not null default true,
  notes_internes    text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  sent_at           timestamptz,
  confirmed_at      timestamptz,
  completed_at      timestamptz,
  cancelled_at      timestamptz,

  -- Unicité du numéro par organisation + type + année (numéro non nul)
  unique (organization_id, type, year, number)
);
create index if not exists idx_documents_org on public.documents (organization_id);
create index if not exists idx_documents_client on public.documents (client_id);
create index if not exists idx_documents_category on public.documents (category_id);
create index if not exists idx_documents_status on public.documents (status);
create unique index if not exists idx_documents_share_token on public.documents (share_token);

-- ───────────────────────── document_lines ─────────────────────────
create table if not exists public.document_lines (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  position    int not null default 0,
  designation text not null,
  quantity    numeric(12,2) not null default 1,
  unit_price  numeric(12,0) not null default 0,
  line_total  numeric(12,0) not null default 0
);
create index if not exists idx_lines_document on public.document_lines (document_id);

-- ───────────────────────── payments ─────────────────────────
create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  amount      numeric(12,0) not null,            -- négatif = remboursement
  method      public.payment_method not null,
  reference   text,                              -- réf MoMo, n° chèque, etc.
  received_at date not null default current_date,
  recorded_by uuid references public.profiles (id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_payments_document on public.payments (document_id);

-- ───────────────────────── category_stats ─────────────────────────
-- Compteurs incrémentés à la complétion d'un document.
create table if not exists public.category_stats (
  category_id   uuid primary key references public.categories (id) on delete cascade,
  realized_count int not null default 0,
  total_revenue numeric(14,0) not null default 0,
  updated_at    timestamptz not null default now()
);
