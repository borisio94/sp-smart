-- ============================================================================
--  Module Billing — 0006 : Lignes d'un document via share_token (public)
-- ----------------------------------------------------------------------------
--  La page publique /facture-privee/[token] et son PDF doivent afficher les
--  lignes du tableau. L'anon n'a aucun accès RLS à document_lines : on expose
--  une fonction SECURITY DEFINER dédiée, filtrée par le token (et jamais sur
--  un document annulé).
--  À appliquer APRÈS 0001-0003.
-- ============================================================================

create or replace function public.get_document_lines_by_token(p_token uuid)
returns table (
  "position" int,
  designation text,
  quantity numeric,
  unit_price numeric,
  line_total numeric
)
language sql
stable
security definer
set search_path = public
as $fn$
  select l.position, l.designation, l.quantity, l.unit_price, l.line_total
    from public.document_lines l
    join public.documents d on d.id = l.document_id
   where d.share_token = p_token
     and d.status <> 'annule'
   order by l.position asc;
$fn$;

grant execute on function public.get_document_lines_by_token(uuid) to anon, authenticated;

-- Expose aussi le type du document via token (utile au PDF public).
-- (get_document_by_token renvoie déjà type, number, etc. — rien à ajouter.)
