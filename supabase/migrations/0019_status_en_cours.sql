-- ============================================================================
--  Module Billing SP Smart Sarl — 0019 : statut « en cours »
-- ----------------------------------------------------------------------------
--  Un marché confirmé n'est pas encore terminé : entre la confirmation et la
--  livraison, le chantier est EN RÉALISATION. Ce statut intermédiaire donne
--  cette visibilité, absente jusqu'ici.
--
--    brouillon → envoye → confirme → en_cours → termine
--                            ↓          ↓
--                          annule     annule
--
--  ATTENTION — cette migration ne contient QUE l'ajout de la valeur
--  d'énumération. PostgreSQL interdit d'utiliser une valeur d'enum dans la
--  même transaction que celle qui l'ajoute : tout le reste (table des
--  charges, versements) vit dans la migration 0020, à exécuter APRÈS.
--
--  Idempotent. À appliquer APRÈS 0018.
-- ============================================================================

-- Insérée juste après « confirme » pour que l'ordre de l'énumération suive le
-- cycle de vie réel (utile aux tris et aux comparaisons).
alter type public.document_status add value if not exists 'en_cours' after 'confirme';

-- Date de démarrage effectif du chantier, au même titre que sent_at,
-- confirmed_at, completed_at et cancelled_at.
alter table public.documents add column if not exists started_at timestamptz;

comment on column public.documents.started_at is
  'Horodatage du passage au statut « en_cours » (démarrage du chantier).';
