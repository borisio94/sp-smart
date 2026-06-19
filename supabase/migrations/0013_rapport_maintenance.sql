-- ============================================================================
--  Module Billing — 0013 : Rapport de maintenance (type standard structuré)
-- ----------------------------------------------------------------------------
--  Ajoute une 7e valeur d'enum `rapport_maintenance` (préfixe RAP) et une
--  colonne `report_data jsonb` portant les sections structurées du rapport
--  (intervention, constat, travaux, tests, recommandations…). Contrairement aux
--  documents commerciaux, un rapport n'a pas de logique de montants : ses totaux
--  restent à 0, son contenu vit entièrement dans `report_data`.
--  Idempotent. À appliquer APRÈS 0010/0011.
--
--  NB : « alter type ... add value » + recréation de doc_prefix() dans la même
--  exécution est sûr (doc_prefix compare le type EN TEXTE t::text, cf. 0010).
-- ============================================================================

alter type public.document_type add value if not exists 'rapport_maintenance';

-- Préfixe de numérotation (RAP-AAAA-NNNN pour un rapport de maintenance).
create or replace function public.doc_prefix(t public.document_type)
returns text language sql immutable as $fn$
  select case t::text
    when 'devis'               then 'DEV'
    when 'proforma'            then 'PRO'
    when 'bon_commande'        then 'BCO'
    when 'facture'             then 'FAC'
    when 'recu'                then 'REC'
    when 'rapport_maintenance' then 'RAP'
    when 'autre'               then 'DOC'
    else 'DOC'
  end;
$fn$;

-- Sections structurées du rapport (JSON). NULL pour tout document non-rapport.
alter table public.documents
  add column if not exists report_data jsonb;
