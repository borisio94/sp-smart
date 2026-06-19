-- ============================================================================
--  Module Billing — 0014 : Trésorerie / Caisse
-- ----------------------------------------------------------------------------
--  Suivi des fonds : un solde global, traçable, alimenté par :
--   - les ENTRÉES (encaissements) : liées à un document OU saisie détaillée ;
--     les paiements de factures créent automatiquement une entrée (trigger).
--   - les DÉPENSES : description obligatoire + catégorie.
--  Réglages ajustables : fonds initial + ligne rouge (seuil minimum).
--  Solde = fonds_initial + Σ entrées − Σ dépenses.
--  Idempotent. À appliquer APRÈS 0011 (current_org_id existe déjà).
-- ============================================================================

-- ───────────── Réglages de caisse (singleton par organisation) ─────────────
create table if not exists public.cash_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  opening_balance bigint  not null default 0,  -- fonds initial disponible (FCFA)
  red_line        bigint  not null default 0,  -- ligne rouge / seuil minimum (FCFA)
  opening_note    text,                         -- note d'ouverture (origine du fonds)
  updated_at      timestamptz not null default now()
);

-- Crée une ligne de réglages par organisation existante (valeurs à 0).
insert into public.cash_settings (organization_id)
  select id from public.organizations
  on conflict (organization_id) do nothing;

-- ───────────── Catégories de dépenses (gérables) ─────────────
create table if not exists public.expense_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,           -- ex : « Loyer », « Salaires », « Achats matériel »
  color           text,
  "order"         int  not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists idx_expense_categories_name
  on public.expense_categories (organization_id, lower(name));

-- ───────────── Mouvements de caisse (registre) ─────────────
create table if not exists public.cash_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by      uuid references public.profiles (id) on delete set null,
  direction       text not null check (direction in ('in', 'out')), -- entrée / dépense
  amount          bigint not null check (amount > 0),                -- montant positif (FCFA)
  occurred_at     date not null default current_date,               -- date de l'opération
  description     text,                                             -- obligatoire pour une dépense
  category_id     uuid references public.expense_categories (id) on delete set null,
  document_id     uuid references public.documents (id) on delete set null,
  payment_id      uuid references public.payments (id) on delete cascade, -- si issu d'un paiement
  method          text,                                             -- moyen (especes, momo_mtn…)
  reference       text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_cash_movements_org_date
  on public.cash_movements (organization_id, occurred_at desc, created_at desc);
create index if not exists idx_cash_movements_payment on public.cash_movements (payment_id);
create index if not exists idx_cash_movements_document on public.cash_movements (document_id);
create index if not exists idx_cash_movements_category on public.cash_movements (category_id);

-- ───────────── RLS (organisation du profil, comme les autres tables) ─────────────
alter table public.cash_settings enable row level security;
alter table public.expense_categories enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists cash_settings_all on public.cash_settings;
create policy cash_settings_all on public.cash_settings
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists expense_categories_all on public.expense_categories;
create policy expense_categories_all on public.expense_categories
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists cash_movements_all on public.cash_movements;
create policy cash_movements_all on public.cash_movements
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- ───────────── Trigger : paiement de facture → entrée en caisse ─────────────
-- Tout paiement crée automatiquement un mouvement lié au document. Un
-- remboursement (paiement négatif) crée une dépense. La suppression du
-- paiement supprime le mouvement (FK on delete cascade).
create or replace function public.tg_payment_to_cash()
returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  v_org uuid;
  v_num text;
begin
  select organization_id, number into v_org, v_num
    from public.documents where id = new.document_id;

  insert into public.cash_movements (
    organization_id, created_by, direction, amount, occurred_at,
    description, document_id, payment_id, method, reference
  ) values (
    v_org,
    new.recorded_by,
    case when new.amount >= 0 then 'in' else 'out' end,
    abs(new.amount),
    new.received_at,
    case when new.amount >= 0 then 'Encaissement ' else 'Remboursement ' end
      || coalesce(v_num, ''),
    new.document_id,
    new.id,
    new.method::text,
    new.reference
  );
  return new;
end;
$fn$;

drop trigger if exists trg_payment_to_cash on public.payments;
create trigger trg_payment_to_cash
  after insert on public.payments
  for each row execute function public.tg_payment_to_cash();
