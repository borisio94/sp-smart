-- ============================================================================
--  Module Billing SP Smart Sarl — 0016 : Devis en plusieurs sections
-- ----------------------------------------------------------------------------
--  Un document à tableau (devis, proforma, bon de commande) peut regrouper ses
--  lignes en sections (« compartiments »), chacune avec son sous-total, puis un
--  total général cumulé. Deux colonnes suffisent sur document_lines :
--    - section        : intitulé du compartiment (ex. « Fabrication métallique »)
--    - is_amount_only : ligne forfaitaire (libellé + montant, sans quantité/PU)
--  Les lignes sans section restent affichées à plat (rétro-compatible).
--  À appliquer APRÈS 0015.
-- ============================================================================

alter table public.document_lines
  add column if not exists section text;

alter table public.document_lines
  add column if not exists is_amount_only boolean not null default false;

comment on column public.document_lines.section is
  'Intitulé de la section / compartiment regroupant la ligne (NULL = hors section).';
comment on column public.document_lines.is_amount_only is
  'Ligne forfaitaire : montant saisi directement (unit_price), sans quantité ni PU.';
