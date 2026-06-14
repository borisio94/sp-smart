-- ============================================================================
--  Module Billing — 0012 : triggers category_stats en SECURITY DEFINER
-- ----------------------------------------------------------------------------
--  Corrige l'erreur RLS « new row violates row-level security policy for table
--  category_stats » survenant quand un utilisateur authentifié crée une
--  catégorie (ou complète un document avec catégorie).
--
--  Cause : la table category_stats n'expose qu'une policy de SELECT ; ses
--  écritures sont censées passer UNIQUEMENT par des triggers. Or ces triggers
--  n'étaient pas SECURITY DEFINER, donc l'INSERT/UPDATE s'exécutait avec les
--  droits de l'appelant et était refusé par la RLS. On les recrée à
--  l'identique (corps inchangé) en SECURITY DEFINER + search_path figé.
--  Idempotent. Les triggers existants restent liés (CREATE OR REPLACE).
-- ============================================================================

-- Crée la ligne category_stats à la création d'une catégorie.
create or replace function public.tg_category_create_stats()
returns trigger language plpgsql
security definer set search_path = public as $fn$
begin
  insert into public.category_stats (category_id) values (new.id)
  on conflict (category_id) do nothing;
  return new;
end;
$fn$;

-- Incrémente/décrémente à la (dé)complétion d'un document.
create or replace function public.tg_document_category_stats()
returns trigger language plpgsql
security definer set search_path = public as $fn$
begin
  if new.category_id is null then
    return new;
  end if;

  if new.status = 'termine' and (old.status is distinct from 'termine') then
    insert into public.category_stats (category_id, realized_count, total_revenue, updated_at)
    values (new.category_id, 1, coalesce(new.total_amount, 0), now())
    on conflict (category_id) do update
      set realized_count = public.category_stats.realized_count + 1,
          total_revenue  = public.category_stats.total_revenue + coalesce(new.total_amount, 0),
          updated_at     = now();

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

-- Document inséré directement en « termine » (saisie historique).
create or replace function public.tg_document_category_stats_insert()
returns trigger language plpgsql
security definer set search_path = public as $fn$
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
