-- ============================================================================
--  Module Billing — 0009 : Encadré « conditions / mentions » optionnel
-- ----------------------------------------------------------------------------
--  Ajoute un interrupteur par document pour afficher (ou non) l'encadré des
--  conditions en bas du PDF. Décoché par défaut, forcé pour les bons de
--  commande. Idempotent. À appliquer APRÈS 0001.
-- ============================================================================

alter table public.documents
  add column if not exists include_conditions boolean not null default false;

-- Rétro-compat : les documents qui ont déjà des modalités/délais continuent
-- d'afficher l'encadré (évite une disparition surprise sur l'existant).
update public.documents
   set include_conditions = true
 where include_conditions = false
   and ( (payment_terms  is not null and length(trim(payment_terms))  > 0)
      or (delivery_terms is not null and length(trim(delivery_terms)) > 0) );

-- Zone obligatoire sur les bons de commande.
update public.documents
   set include_conditions = true
 where type = 'bon_commande';
