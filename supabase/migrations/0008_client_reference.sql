-- ============================================================================
--  Module Billing — 0008 : Référence client auto-générée (CLI-AAAA-NNNN)
-- ----------------------------------------------------------------------------
--  Chaque client reçoit à sa création un code unique permanent au format
--  CLI-<année>-<séquence4>, indépendant par organisation et par année.
--  Réutilise la même stratégie que la numérotation des documents (verrou
--  consultatif transactionnel pour éviter les collisions concurrentes).
--  Idempotent. À appliquer APRÈS 0001.
-- ============================================================================

alter table public.clients
  add column if not exists ref      text,
  add column if not exists ref_year int,
  add column if not exists ref_seq  int;

-- Unicité du code par organisation (lorsqu'il est renseigné).
create unique index if not exists idx_clients_ref
  on public.clients (organization_id, ref)
  where ref is not null;

-- ───────────── Génération automatique du code client ─────────────
create or replace function public.tg_client_reference()
returns trigger language plpgsql as $fn$
declare
  v_next_seq integer;
begin
  -- Respecte un code fourni manuellement (import / cas particulier).
  if new.ref is not null and length(trim(new.ref)) > 0 then
    return new;
  end if;

  new.ref_year := extract(year from coalesce(new.created_at, now()))::int;

  -- Verrou consultatif sur (organisation, année) → séquence sans collision.
  perform pg_advisory_xact_lock(
    hashtextextended(
      coalesce(new.organization_id::text, '') || ':client:' || new.ref_year::text,
      0
    )
  );

  select coalesce(max(c.ref_seq), 0) + 1
    into v_next_seq
    from public.clients c
   where c.organization_id = new.organization_id
     and c.ref_year = new.ref_year;

  new.ref_seq := v_next_seq;
  new.ref := 'CLI-' || new.ref_year::text || '-' || lpad(v_next_seq::text, 4, '0');
  return new;
end;
$fn$;

drop trigger if exists tr_client_reference on public.clients;
create trigger tr_client_reference before insert on public.clients
  for each row execute function public.tg_client_reference();

-- ───────────── Attribue un code aux clients existants (sans code) ─────────────
-- Numérotés par ordre de création, dans l'année de leur created_at.
do $do$
declare
  r record;
  seqs jsonb := '{}'::jsonb;
  k text;
  n int;
begin
  for r in
    select id, organization_id,
           extract(year from created_at)::int as y
      from public.clients
     where ref is null
     order by created_at asc
  loop
    k := r.organization_id::text || ':' || r.y::text;
    -- séquence courante pour cette clé : max existant si premier passage
    if not (seqs ? k) then
      select coalesce(max(ref_seq), 0) into n
        from public.clients
       where organization_id = r.organization_id and ref_year = r.y;
      seqs := jsonb_set(seqs, array[k], to_jsonb(n));
    end if;
    n := (seqs ->> k)::int + 1;
    seqs := jsonb_set(seqs, array[k], to_jsonb(n));

    update public.clients
       set ref_year = r.y,
           ref_seq  = n,
           ref      = 'CLI-' || r.y::text || '-' || lpad(n::text, 4, '0')
     where id = r.id;
  end loop;
end
$do$;
