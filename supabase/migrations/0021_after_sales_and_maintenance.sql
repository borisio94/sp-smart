-- ============================================================================
--  Module Billing SP Smart Sarl — 0021 : après-vente & contrat de maintenance
-- ----------------------------------------------------------------------------
--  Un chantier ne s'arrête pas à sa livraison : une panne survient, elle coûte
--  une intervention et se refacture. Jusqu'ici tout cela retombait dans les
--  chiffres du marché initial — une réparation sous garantie amputait la marge
--  du chantier, qui devenait impossible à juger.
--
--  Trois notions séparées :
--
--   1. PHASE d'une charge (`market_expenses.phase`) : travaux ou panne.
--   2. PHASE d'une facture (`documents.market_phase`) : une facture
--      d'après-vente est rattachée au marché pour le suivi, mais ne fait PAS
--      partie de son règlement.
--   3. CONTRAT de maintenance (`maintenance_contracts`) : un par chantier.
--
--  Conséquence majeure sur le règlement du marché : sans le filtre posé plus
--  bas, une réparation de 50 000 sur un marché de 1 300 000 afficherait
--  « encaissé 1 350 000 sur 1 300 000 » et fausserait le reste à payer — y
--  compris sur le lien privé du client. Les deux implémentations du suivi
--  (`settlement-query.ts` et `get_document_by_token`) doivent donc appliquer
--  le MÊME filtre, sous peine de divergence entre la fiche admin et la page
--  publique.
--
--  Idempotent. À appliquer APRÈS 0020.
-- ============================================================================

-- ───────────── 1. Nature d'une charge ─────────────
alter table public.market_expenses
  add column if not exists phase text not null default 'travaux';

do $$ begin
  alter table public.market_expenses
    add constraint market_expenses_phase_check
    check (phase in ('travaux', 'panne'));
exception when duplicate_object then null; end $$;

create index if not exists idx_market_expenses_phase
  on public.market_expenses (document_id, phase);

comment on column public.market_expenses.phase is
  'travaux = chantier initial · panne = intervention après-vente.';

-- ───────────── 2. Nature d'une facture rattachée ─────────────
--  Les factures existantes sont toutes des travaux : aucune n'était une
--  intervention après-vente, la valeur par défaut est donc la bonne.
alter table public.documents
  add column if not exists market_phase text not null default 'travaux';

do $$ begin
  alter table public.documents
    add constraint documents_market_phase_check
    check (market_phase in ('travaux', 'panne'));
exception when duplicate_object then null; end $$;

create index if not exists idx_documents_market_phase
  on public.documents (linked_document_id, market_phase);

comment on column public.documents.market_phase is
  'Rattachement au marché : travaux (règlement du marché) ou panne (après-vente, hors règlement).';

-- ───────────── 3. Contrat de maintenance ─────────────
--  Un seul contrat par chantier : `document_id` est la clé primaire. Le
--  renouvellement se fait en repoussant l'échéance, pas en empilant les lignes.
create table if not exists public.maintenance_contracts (
  document_id     uuid primary key references public.documents (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  active          boolean not null default true,
  start_date      date,
  end_date        date,                                  -- échéance
  amount          bigint not null default 0 check (amount >= 0),
  periodicity     text not null default 'annuel',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$ begin
  alter table public.maintenance_contracts
    add constraint maintenance_contracts_periodicity_check
    check (periodicity in ('mensuel', 'trimestriel', 'semestriel', 'annuel'));
exception when duplicate_object then null; end $$;

create index if not exists idx_maintenance_contracts_org
  on public.maintenance_contracts (organization_id, active);

drop trigger if exists tr_maintenance_contracts_updated_at on public.maintenance_contracts;
create trigger tr_maintenance_contracts_updated_at before update on public.maintenance_contracts
  for each row execute function public.tg_set_updated_at();

alter table public.maintenance_contracts enable row level security;

drop policy if exists maintenance_contracts_all on public.maintenance_contracts;
create policy maintenance_contracts_all on public.maintenance_contracts
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- ───────────── 4. Suivi du marché : exclure l'après-vente ─────────────
--  Reprend 0018 à l'identique, à deux différences près :
--   - les agrégats du marché ignorent les factures `market_phase = 'panne'` ;
--   - une facture d'après-vente n'affiche aucun suivi de marché (elle n'en
--     fait pas partie), donc la cotation n'est pas jointe pour elle.
drop function if exists public.get_document_by_token(uuid);

create or replace function public.get_document_by_token(p_token uuid)
returns table (
  id uuid,
  type public.document_type,
  number text,
  issue_date date,
  validity_date date,
  title text,
  subject text,
  body_mode public.body_mode,
  body_text text,
  materials_subtotal numeric,
  labor_amount numeric,
  discount_amount numeric,
  total_amount numeric,
  amount_in_words text,
  payment_terms text,
  delivery_terms text,
  status public.document_status,
  payment_status public.payment_status,
  client_name text,
  organization_name text,
  signature_required boolean,
  signed_at timestamptz,
  signed_by_name text,
  market_total numeric,
  invoiced_total numeric,
  settled_total numeric,
  quotation_number text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select d.id, d.type, d.number, d.issue_date, d.validity_date,
         d.title, d.subject, d.body_mode, d.body_text,
         d.materials_subtotal, d.labor_amount, d.discount_amount,
         d.total_amount, d.amount_in_words, d.payment_terms, d.delivery_terms,
         d.status, d.payment_status,
         c.name as client_name,
         o.name as organization_name,
         d.signature_required, d.signed_at, d.signed_by_name,
         q.total_amount as market_total,
         m.invoiced_total,
         m.settled_total,
         q.number as quotation_number
    from public.documents d
    left join public.clients c on c.id = d.client_id
    left join public.organizations o on o.id = d.organization_id
    -- Un reçu pointe vers sa facture : on remonte d'un cran pour le marché.
    left join public.documents f
           on d.type = 'recu'
          and f.id = d.linked_document_id
    -- Cotation de rattachement (devis / proforma / bon de commande). Une
    -- facture d'après-vente n'est pas rattachée au règlement du marché : elle
    -- se lit seule, comme une facture isolée.
    left join public.documents q
           on d.market_phase <> 'panne'
          and q.id = case
                       when d.type = 'recu' then f.linked_document_id
                       else d.linked_document_id
                     end
    -- Agrégats du marché : total facturé et total encaissé, hors après-vente.
    left join lateral (
      select
        coalesce(sum(inv.total_amount), 0) as invoiced_total,
        coalesce((
          select sum(p.amount)
            from public.payments p
            join public.documents i2 on i2.id = p.document_id
           where i2.linked_document_id = q.id
             and i2.type = 'facture'
             and i2.status <> 'annule'
             and i2.market_phase <> 'panne'
        ), 0) as settled_total
        from public.documents inv
       where inv.linked_document_id = q.id
         and inv.type = 'facture'
         and inv.status <> 'annule'
         and inv.market_phase <> 'panne'
    ) m on q.id is not null
   where d.share_token = p_token
     and d.status <> 'annule';
$fn$;

grant execute on function public.get_document_by_token(uuid) to anon, authenticated;
