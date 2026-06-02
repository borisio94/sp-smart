-- ============================================================================
--  Module Billing SP Smart Sarl — 0003 : Row Level Security (RLS)
-- ----------------------------------------------------------------------------
--  Règle : un utilisateur authentifié n'accède QU'AUX lignes de SON
--  organisation. Le public (anon) n'a AUCUN accès direct aux tables ;
--  il passe par des fonctions SECURITY DEFINER dédiées (token facture
--  + stats publiques) qui n'exposent que le strict nécessaire.
--  À appliquer APRÈS 0001 et 0002.
-- ============================================================================

-- ───────────── Helper : organisation de l'utilisateur courant ─────────────
-- SECURITY DEFINER pour éviter la récursion RLS sur la table profiles.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select organization_id from public.profiles where id = auth.uid();
$fn$;

-- ───────────── Activation RLS ─────────────
alter table public.organizations  enable row level security;
alter table public.profiles       enable row level security;
alter table public.clients        enable row level security;
alter table public.categories     enable row level security;
alter table public.documents      enable row level security;
alter table public.document_lines enable row level security;
alter table public.payments       enable row level security;
alter table public.category_stats enable row level security;

-- ───────────── organizations ─────────────
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations
  for update to authenticated
  using (id = public.current_org_id())
  with check (id = public.current_org_id());

-- ───────────── profiles ─────────────
-- Chaque user lit son propre profil et ceux de son organisation.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ───────────── Tables scoupées par organisation ─────────────
-- Macro mentale : SELECT/INSERT/UPDATE/DELETE si organization_id = current_org_id()

-- clients
drop policy if exists clients_all on public.clients;
create policy clients_all on public.clients
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- categories
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- documents
drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- document_lines (via le document parent)
drop policy if exists lines_all on public.document_lines;
create policy lines_all on public.document_lines
  for all to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_lines.document_id
        and d.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_lines.document_id
        and d.organization_id = public.current_org_id()
    )
  );

-- payments (via le document parent)
drop policy if exists payments_all on public.payments;
create policy payments_all on public.payments
  for all to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = payments.document_id
        and d.organization_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = payments.document_id
        and d.organization_id = public.current_org_id()
    )
  );

-- category_stats (lecture/maj par les triggers en SECURITY DEFINER, et
-- lecture par les membres de l'organisation pour l'admin)
drop policy if exists stats_select on public.category_stats;
create policy stats_select on public.category_stats
  for select to authenticated
  using (
    exists (
      select 1 from public.categories c
      where c.id = category_stats.category_id
        and c.organization_id = public.current_org_id()
    )
  );

-- ───────────── Accès PUBLIC contrôlé (anon) ─────────────
-- Aucune policy "anon" directe : on expose des fonctions SECURITY DEFINER.

-- 1) Lecture d'un document par son share_token (page /facture-privee/[token]).
--    Renvoie un sous-ensemble de colonnes, jamais les notes internes.
--    Document annulé → renvoie 0 ligne (page neutre côté app).
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
  organization_name text
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
         o.name as organization_name
    from public.documents d
    left join public.clients c on c.id = d.client_id
    left join public.organizations o on o.id = d.organization_id
   where d.share_token = p_token
     and d.status <> 'annule';
$fn$;

grant execute on function public.get_document_by_token(uuid) to anon, authenticated;

-- 2) Statistiques publiques (compteur de réalisations sur le site).
--    N'expose QUE le nombre de réalisations, jamais le chiffre d'affaires.
create or replace function public.get_public_category_stats()
returns table (
  slug text,
  name_fr text,
  name_en text,
  lucide_icon text,
  realized_count int
)
language sql
stable
security definer
set search_path = public
as $fn$
  select c.slug, c.name_fr, c.name_en, c.lucide_icon,
         coalesce(s.realized_count, 0) as realized_count
    from public.categories c
    left join public.category_stats s on s.category_id = c.id
   where c.active = true
   order by c."order" asc;
$fn$;

grant execute on function public.get_public_category_stats() to anon, authenticated;
