-- ============================================================================
--  Module Billing SP Smart Sarl — 0015 : Facture d'acompte / facture définitive
-- ----------------------------------------------------------------------------
--  Le type « facture » adopte une mise en page dédiée avec deux dispositions :
--    - ACOMPTE     : récapitulatif du paiement (marché TTC / acompte / solde)
--    - DÉFINITIVE  : déduction des acomptes déjà versés → net à payer
--  Les données propres à la facture sont stockées en JSONB (invoice_data),
--  sur le modèle de report_data (rapport de maintenance).
--  Le NIU fiscal du client (affiché sur la facture « si entreprise ») rejoint
--  la fiche client.
--  À appliquer APRÈS 0014.
-- ============================================================================

-- ───────────── documents.invoice_data ─────────────
-- Forme applicative (cf. lib/billing/types.ts → InvoiceData) :
--   {
--     "kind": "acompte" | "definitive",
--     "payment_method": "" | "especes" | "momo_mtn" | ...,
--     "devis_ref": "DEV-2026-0001 du 12/03/2026",
--     "advance_percent": 50,          -- acompte : % du marché
--     "advance_amount": 600000,       -- acompte : montant versé ce jour
--     "deductions": [                 -- définitive : acomptes déduits
--       { "reference": "FAC-2026-0001", "date": "2026-03-12", "amount": 600000 }
--     ]
--   }
alter table public.documents
  add column if not exists invoice_data jsonb;

comment on column public.documents.invoice_data is
  'Données propres aux factures (acompte / définitive) : nature, mode de règlement, acompte versé, déductions. NULL pour les autres types.';

-- ───────────── clients.niu ─────────────
alter table public.clients
  add column if not exists niu text;

comment on column public.clients.niu is
  'Numéro identifiant unique (NIU) fiscal du client, affiché sur les factures « si entreprise ».';
