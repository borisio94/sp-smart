-- ============================================================================
--  Module Billing SP Smart Sarl — 0002 : Fonctions & triggers
-- ----------------------------------------------------------------------------
--  - Numérotation automatique (PREFIX-ANNEE-SEQ) par type + année
--  - share_token (déjà géré par DEFAULT, trigger de secours)
--  - updated_at automatique
--  - Compteurs category_stats à la complétion / dé-complétion
--  NB : la conversion "montant en lettres" est faite côté application
--       (lib/billing/amountToWords.ts, Phase 3) — pas en SQL.
--  À appliquer APRÈS 0001.
-- ============================================================================

-- ───────────── updated_at ─────────────
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists tr_org_updated_at on public.organizations;
create trigger tr_org_updated_at before update on public.organizations
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tr_clients_updated_at on public.clients;
create trigger tr_clients_updated_at before update on public.clients
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tr_documents_updated_at on public.documents;
create trigger tr_documents_updated_at before update on public.documents
  for each row execute function public.tg_set_updated_at();

-- ───────────── Préfixe de numéro selon le type ─────────────
create or replace function public.doc_prefix(t public.document_type)
returns text language sql immutable as $fn$
  select case t
    when 'devis'        then 'DEV'
    when 'proforma'     then 'PRO'
    when 'bon_commande' then 'BCO'
    when 'facture'      then 'FAC'
    when 'recu'         then 'REC'
  end;
$fn$;

-- ───────────── Numérotation automatique ─────────────
-- Génère number = PREFIX-ANNEE-SEQ4. Séquence indépendante par
-- organisation + type + année. Si number est déjà fourni (saisie
-- historique), on respecte la valeur manuelle.
create or replace function public.tg_document_numbering()
returns trigger language plpgsql as $fn$
declare
  v_next_seq integer;
begin
  -- Année dérivée de la date d'émission
  new.year := extract(year from coalesce(new.issue_date, current_date))::int;

  -- Numéro manuel fourni (ex. historique) → ne pas écraser
  if new.number is not null and length(trim(new.number)) > 0 then
    if new.sequence is null then
      new.sequence := 0;
    end if;
    return new;
  end if;

  -- Verrou consultatif transactionnel sur la combinaison org/type/année
  -- afin d'éviter les collisions de séquence en cas d'inserts concurrents.
  perform pg_advisory_xact_lock(
    hashtextextended(
      coalesce(new.organization_id::text, '') || ':'
        || new.type::text || ':' || new.year::text,
      0
    )
  );

  select coalesce(max(d.sequence), 0) + 1
    into v_next_seq
    from public.documents as d
   where d.organization_id = new.organization_id
     and d.type = new.type
     and d.year = new.year;

  new.sequence := v_next_seq;
  new.number := public.doc_prefix(new.type)
                || '-' || new.year::text
                || '-' || lpad(v_next_seq::text, 4, '0');
  return new;
end;
$fn$;

drop trigger if exists tr_doc_numbering on public.documents;
create trigger tr_doc_numbering before insert on public.documents
  for each row execute function public.tg_document_numbering();

-- ───────────── share_token (sécurité) ─────────────
-- DEFAULT gen_random_uuid() couvre déjà le cas ; ce trigger garantit
-- qu'un token NULL injecté manuellement est tout de même rempli.
create or replace function public.tg_document_share_token()
returns trigger language plpgsql as $fn$
begin
  if new.share_token is null then
    new.share_token := gen_random_uuid();
  end if;
  return new;
end;
$fn$;

drop trigger if exists tr_doc_share_token on public.documents;
create trigger tr_doc_share_token before insert on public.documents
  for each row execute function public.tg_document_share_token();

-- ───────────── Compteurs category_stats ─────────────
-- À la 1ʳᵉ complétion (status → 'termine') : +1 réalisation, + montant.
-- Au retour depuis 'termine' vers un autre statut : -1, - montant.
create or replace function public.tg_document_category_stats()
returns trigger language plpgsql as $fn$
begin
  if new.category_id is null then
    return new;
  end if;

  -- Passage à 'termine'
  if new.status = 'termine' and (old.status is distinct from 'termine') then
    insert into public.category_stats (category_id, realized_count, total_revenue, updated_at)
    values (new.category_id, 1, coalesce(new.total_amount, 0), now())
    on conflict (category_id) do update
      set realized_count = public.category_stats.realized_count + 1,
          total_revenue  = public.category_stats.total_revenue + coalesce(new.total_amount, 0),
          updated_at     = now();

  -- Sortie de 'termine'
  elsif old.status = 'termine' and (new.status is distinct from 'termine') then
    update public.category_stats
       set realized_count = greatest(realized_count - 1, 0),
           total_revenue  = greatest(total_revenue - coalesce(old.total_amount, 0), 0),
           updated_at     = now()
     where category_id = old.category_id;
  end if;

  return new;
end;
$fn$;

drop trigger if exists tr_doc_category_stats on public.documents;
create trigger tr_doc_category_stats after update of status on public.documents
  for each row execute function public.tg_document_category_stats();

-- Cas d'un document inséré DIRECTEMENT en 'termine' (saisie historique) :
create or replace function public.tg_document_category_stats_insert()
returns trigger language plpgsql as $fn$
begin
  if new.category_id is not null and new.status = 'termine' then
    insert into public.category_stats (category_id, realized_count, total_revenue, updated_at)
    values (new.category_id, 1, coalesce(new.total_amount, 0), now())
    on conflict (category_id) do update
      set realized_count = public.category_stats.realized_count + 1,
          total_revenue  = public.category_stats.total_revenue + coalesce(new.total_amount, 0),
          updated_at     = now();
  end if;
  return new;
end;
$fn$;

drop trigger if exists tr_doc_category_stats_insert on public.documents;
create trigger tr_doc_category_stats_insert after insert on public.documents
  for each row execute function public.tg_document_category_stats_insert();

-- ───────────── Crée la ligne category_stats avec la catégorie ─────────────
create or replace function public.tg_category_create_stats()
returns trigger language plpgsql as $fn$
begin
  insert into public.category_stats (category_id) values (new.id)
  on conflict (category_id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists tr_category_create_stats on public.categories;
create trigger tr_category_create_stats after insert on public.categories
  for each row execute function public.tg_category_create_stats();
