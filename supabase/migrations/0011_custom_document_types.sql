-- ============================================================================
--  Module Billing — 0011 : Types de documents personnalisés
-- ----------------------------------------------------------------------------
--  L'utilisateur peut créer ses propres types (ex. « Attestation » → ATT) en
--  plus des 5 types standards. Un document perso est stocké en type='autre'
--  + custom_type_id → on réutilise la valeur d'enum « autre » (cf. 0010).
--  Numérotation : préfixe propre par type, séquence indépendante.
--  Idempotent. À appliquer APRÈS 0010.
-- ============================================================================

-- ───────────── Table des types personnalisés ─────────────
create table if not exists public.document_types (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,         -- ex : « Attestation »
  prefix          text not null,         -- ex : « ATT » → ATT-2026-0001
  color           text,                  -- réservé (couleur bandeau, usage futur)
  "order"         int  not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Unicité du préfixe ET du nom par organisation (insensible à la casse).
create unique index if not exists idx_doc_types_prefix
  on public.document_types (organization_id, upper(prefix));
create unique index if not exists idx_doc_types_name
  on public.document_types (organization_id, lower(name));

-- ───────────── Lien depuis un document ─────────────
alter table public.documents
  add column if not exists custom_type_id uuid
    references public.document_types (id) on delete set null;
create index if not exists idx_documents_custom_type
  on public.documents (custom_type_id);

-- ───────────── RLS (organisation du profil, comme les autres tables) ─────────────
alter table public.document_types enable row level security;
drop policy if exists document_types_all on public.document_types;
create policy document_types_all on public.document_types
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- ───────────── Numérotation : prise en charge des types personnalisés ─────────────
-- Pour un type perso : préfixe issu de document_types, séquence indépendante
-- par (organisation, type perso, année). Pour les types standards : inchangé.
create or replace function public.tg_document_numbering()
returns trigger language plpgsql as $fn$
declare
  v_next_seq int;
  v_prefix   text;
  v_key      text;
begin
  new.year := extract(year from coalesce(new.issue_date, current_date))::int;

  -- Numéro manuel fourni (saisie historique) → ne pas écraser.
  if new.number is not null and length(trim(new.number)) > 0 then
    if new.sequence is null then new.sequence := 0; end if;
    return new;
  end if;

  if new.custom_type_id is not null then
    -- Type personnalisé : préfixe et séquence propres.
    select prefix into v_prefix from public.document_types where id = new.custom_type_id;
    v_prefix := coalesce(nullif(trim(v_prefix), ''), 'DOC');
    v_key := coalesce(new.organization_id::text, '')
          || ':ct:' || new.custom_type_id::text || ':' || new.year::text;

    perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

    select coalesce(max(d.sequence), 0) + 1 into v_next_seq
      from public.documents d
     where d.organization_id = new.organization_id
       and d.custom_type_id = new.custom_type_id
       and d.year = new.year;
  else
    -- Type standard : comportement historique (par valeur d'enum).
    v_prefix := public.doc_prefix(new.type);
    v_key := coalesce(new.organization_id::text, '')
          || ':' || new.type::text || ':' || new.year::text;

    perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

    select coalesce(max(d.sequence), 0) + 1 into v_next_seq
      from public.documents d
     where d.organization_id = new.organization_id
       and d.type = new.type
       and d.custom_type_id is null
       and d.year = new.year;
  end if;

  new.sequence := v_next_seq;
  new.number := v_prefix || '-' || new.year::text || '-' || lpad(v_next_seq::text, 4, '0');
  return new;
end;
$fn$;
