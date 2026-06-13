-- ============================================================================
--  Module Billing — 0010 : Type de document « autre » + intitulé libre
-- ----------------------------------------------------------------------------
--  Ajoute une 6e valeur au type document_type. Pour un document « autre »,
--  l'intitulé affiché dans le bandeau du PDF provient du champ `title`
--  (aucune colonne supplémentaire). Idempotent. À appliquer APRÈS 0001/0002.
--
--  NB : sur PostgreSQL 12+ (Supabase = PG15), « alter type ... add value »
--  s'exécute sans souci. La fonction doc_prefix compare le type EN TEXTE
--  (t::text) : elle ne dépend donc pas de la nouvelle valeur d'enum et peut
--  être recréée dans la même exécution, sans erreur « unsafe use of value ».
-- ============================================================================

alter type public.document_type add value if not exists 'autre';

-- Préfixe de numérotation par type (DOC-AAAA-NNNN pour « autre »).
create or replace function public.doc_prefix(t public.document_type)
returns text language sql immutable as $fn$
  select case t::text
    when 'devis'        then 'DEV'
    when 'proforma'     then 'PRO'
    when 'bon_commande' then 'BCO'
    when 'facture'      then 'FAC'
    when 'recu'         then 'REC'
    when 'autre'        then 'DOC'
    else 'DOC'
  end;
$fn$;
