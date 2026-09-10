-- ============================================================================
--  Module Billing SP Smart Sarl — 0020 : charges de marché & versements caisse
-- ----------------------------------------------------------------------------
--  Un marché (devis / proforma / bon de commande) coûte avant de rapporter :
--  achat de matériel, transport, main d'œuvre… Ces charges étaient invisibles,
--  si bien que le montant du marché passait pour du bénéfice.
--
--  Deux notions distinctes, volontairement séparées :
--
--   1. MARGE du chantier, connue dès la signature :
--         total du marché − charges = net du marché
--
--   2. DISPONIBLE réel, seul argent physiquement en main :
--         encaissé du client − charges = disponible à verser en caisse
--
--  Le versement en caisse est PLAFONNÉ par le disponible (2), jamais par la
--  marge (1) : on ne dépose pas un argent que le client n'a pas encore remis.
--  Le calcul vit dans `src/lib/billing/market.ts` (module pur, partagé).
--
--  Les charges sont INTERNES : elles n'apparaissent ni sur le PDF client, ni
--  sur la page du lien privé (`get_document_by_token` n'est pas touchée).
--
--  Idempotent. À appliquer APRÈS 0019 (statut « en_cours » déjà présent).
-- ============================================================================

-- ───────────── Charges d'un marché ─────────────
--  `document_id` pointe la COTATION (devis / proforma / bon_commande) qui
--  porte le marché — jamais une facture : c'est la cotation qui fait foi du
--  montant total, les factures n'en portent que des parts (acomptes).
create table if not exists public.market_expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id     uuid not null references public.documents (id) on delete cascade,
  created_by      uuid references public.profiles (id) on delete set null,
  reason          text not null,                        -- raison de la charge (obligatoire)
  amount          bigint not null check (amount > 0),   -- montant positif (FCFA)
  occurred_at     date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_market_expenses_document
  on public.market_expenses (document_id, occurred_at desc, created_at desc);
create index if not exists idx_market_expenses_org
  on public.market_expenses (organization_id);

drop trigger if exists tr_market_expenses_updated_at on public.market_expenses;
create trigger tr_market_expenses_updated_at before update on public.market_expenses
  for each row execute function public.tg_set_updated_at();

comment on table public.market_expenses is
  'Charges internes d''un marché (cotation). Jamais exposées au client.';

-- ───────────── Origine d'un mouvement de caisse ─────────────
--  'manuel'   : saisi à la main dans la caisse (cas par défaut, existant)
--  'marche'   : versement du net d'un marché → document_id = la cotation
--  'paiement' : issu de l'ancien trigger paiement→caisse (historique)
alter table public.cash_movements
  add column if not exists source text not null default 'manuel';

do $$ begin
  alter table public.cash_movements
    add constraint cash_movements_source_check
    check (source in ('manuel', 'marche', 'paiement'));
exception when duplicate_object then null; end $$;

create index if not exists idx_cash_movements_source_document
  on public.cash_movements (source, document_id);

-- Les mouvements déjà créés par le trigger portent un payment_id : on les
-- requalifie pour que l'historique reste lisible après sa désactivation.
update public.cash_movements
   set source = 'paiement'
 where payment_id is not null
   and source = 'manuel';

-- ───────────── Désactivation du trigger paiement → caisse ─────────────
--  Décision métier : l'argent d'un marché n'entre plus en caisse au moment du
--  paiement. Il y entre APRÈS déduction des charges, par un versement explicite
--  (cf. `payMarketToCash`). Sans cela, le même argent serait compté deux fois.
--
--  Seul le TRIGGER est retiré ; la fonction `tg_payment_to_cash` est conservée
--  intacte pour pouvoir rétablir l'ancien comportement d'une seule ligne :
--     create trigger trg_payment_to_cash after insert on public.payments
--       for each row execute function public.tg_payment_to_cash();
drop trigger if exists trg_payment_to_cash on public.payments;

-- ───────────── RLS : même règle que le reste du module ─────────────
alter table public.market_expenses enable row level security;

drop policy if exists market_expenses_all on public.market_expenses;
create policy market_expenses_all on public.market_expenses
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
