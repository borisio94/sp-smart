-- ============================================================================
--  Module Billing SP Smart Sarl — 0004 : Seed (organisation + catégories)
-- ----------------------------------------------------------------------------
--  ⚠️ À PERSONNALISER avant exécution : remplace les valeurs « A_REMPLIR »
--     par les coordonnées légales réelles (cf. ACTIONS_PHASE_1.md section 3).
--  Idempotent : ré-exécutable sans dupliquer (clé d'unicité sur le nom org
--  et sur (organization_id, slug) pour les catégories).
--  À appliquer APRÈS 0001/0002/0003.
-- ============================================================================

-- ───────────── Organisation (singleton SP Smart) ─────────────
insert into public.organizations (
  name, legal_form, niu, rccm, capital,
  address, phone, email, website,
  bank_name, bank_account, bank_bic,
  momo_mtn, momo_orange,
  fiscal_regime,
  default_payment_terms, default_delivery_terms
)
select
  'SP SMART SARL',          -- name              ⚠️ A_REMPLIR si différent
  'SARL',                   -- legal_form
  'A_REMPLIR',              -- niu               ⚠️
  'A_REMPLIR',              -- rccm              ⚠️
  'A_REMPLIR',              -- capital           ⚠️ (ex "1 000 000")
  'A_REMPLIR',              -- address           ⚠️
  'A_REMPLIR',              -- phone             ⚠️
  'A_REMPLIR',              -- email             ⚠️
  'https://spsmart.cm',     -- website
  'A_REMPLIR',              -- bank_name
  'A_REMPLIR',              -- bank_account
  'A_REMPLIR',              -- bank_bic
  'A_REMPLIR',              -- momo_mtn
  'A_REMPLIR',              -- momo_orange
  'simplifie',              -- fiscal_regime
  'Acompte de 50 % à la commande, solde à la livraison.',  -- modalités par défaut
  'Délai d''exécution : à convenir. Garantie : 12 mois pièces et main d''œuvre.'
where not exists (select 1 from public.organizations);

-- ───────────── Catégories (9 services du site) ─────────────
-- Insère pour l'organisation SP Smart (première organisation).
with org as (select id from public.organizations order by created_at asc limit 1)
insert into public.categories (organization_id, slug, name_fr, name_en, lucide_icon, color, "order", active)
select org.id, v.slug, v.name_fr, v.name_en, v.lucide_icon, v.color, v.ord, true
from org, (values
  ('motorisation-portails', 'Motorisation de portails',  'Gate automation',        'door-open',      '#0f3a8c', 1),
  ('motorisation-volets',   'Motorisation de volets',     'Shutter automation',     'blinds',         '#0f3a8c', 2),
  ('videosurveillance',     'Vidéosurveillance',          'Video surveillance',     'cctv',           '#0f3a8c', 3),
  ('securite-incendie',     'Sécurité incendie',          'Fire safety',            'flame',          '#b91c1c', 4),
  ('anti-intrusion',        'Anti-intrusion',             'Anti-intrusion',         'shield-alert',   '#0a2a6b', 5),
  ('cloture-electrique',    'Clôture électrique',         'Electric fencing',       'fence',          '#0a2a6b', 6),
  ('controle-acces',        'Contrôle d''accès',          'Access control',         'scan-face',      '#0f3a8c', 7),
  ('electricite',           'Électricité',                'Electrical works',       'zap',            '#f59e0b', 8),
  ('solaire',               'Énergie solaire',            'Solar energy',           'sun',            '#15803d', 9)
) as v(slug, name_fr, name_en, lucide_icon, color, ord)
on conflict (organization_id, slug) do nothing;
