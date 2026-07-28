-- ============================================================================
--  Module Billing SP Smart Sarl — 0018 : suivi du marché sur le lien privé
-- ----------------------------------------------------------------------------
--  Une facture d'acompte ne porte que sa part du marché (ex. 780 000 sur un
--  devis de 1 300 000). Le client qui ouvre son lien privé ne voyait donc que
--  le montant de la facture, sans savoir ce qui restait dû sur l'ensemble.
--
--  `get_document_by_token` expose désormais, pour un document rattaché à une
--  cotation (devis / proforma / bon de commande) :
--    - market_total      : total de la cotation de rattachement
--    - invoiced_total    : somme des factures émises sur ce marché (hors annulées)
--    - settled_total     : somme réellement encaissée sur ces factures
--    - quotation_number  : numéro de la cotation, affiché en référence
--
--  Le reste à payer se déduit côté applicatif (market_total − settled_total),
--  exactement comme le fait `src/lib/billing/settlement.ts` — mêmes règles,
--  deux implémentations, pour que PDF, fiche admin et page publique
--  s'accordent toujours.
--
--  Aucun droit supplémentaire n'est ouvert : la fonction reste SECURITY
--  DEFINER et ne renvoie que des agrégats, jamais le détail des paiements.
--  À appliquer APRÈS 0017.
-- ============================================================================

-- Le type de retour change → suppression puis recréation.
drop function if exists public.get_document_by_token(uuid);

create or replace function public.get_document_by_token(p_token uuid)
returns table (
  id uuid,
  type public.document_type,
  number text,
  issue_date date,
  validity_date date,
  title text,
  subject text,
  body_mode public.body_mode,
  body_text text,
  materials_subtotal numeric,
  labor_amount numeric,
  discount_amount numeric,
  total_amount numeric,
  amount_in_words text,
  payment_terms text,
  delivery_terms text,
  status public.document_status,
  payment_status public.payment_status,
  client_name text,
  organization_name text,
  signature_required boolean,
  signed_at timestamptz,
  signed_by_name text,
  market_total numeric,
  invoiced_total numeric,
  settled_total numeric,
  quotation_number text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select d.id, d.type, d.number, d.issue_date, d.validity_date,
         d.title, d.subject, d.body_mode, d.body_text,
         d.materials_subtotal, d.labor_amount, d.discount_amount,
         d.total_amount, d.amount_in_words, d.payment_terms, d.delivery_terms,
         d.status, d.payment_status,
         c.name as client_name,
         o.name as organization_name,
         d.signature_required, d.signed_at, d.signed_by_name,
         q.total_amount as market_total,
         m.invoiced_total,
         m.settled_total,
         q.number as quotation_number
    from public.documents d
    left join public.clients c on c.id = d.client_id
    left join public.organizations o on o.id = d.organization_id
    -- Un reçu pointe vers sa facture : on remonte d'un cran pour le marché.
    left join public.documents f
           on d.type = 'recu'
          and f.id = d.linked_document_id
    -- Cotation de rattachement (devis / proforma / bon de commande).
    left join public.documents q
           on q.id = case
                       when d.type = 'recu' then f.linked_document_id
                       else d.linked_document_id
                     end
    -- Agrégats du marché : total facturé et total encaissé.
    left join lateral (
      select
        coalesce(sum(inv.total_amount), 0) as invoiced_total,
        coalesce((
          select sum(p.amount)
            from public.payments p
            join public.documents i2 on i2.id = p.document_id
           where i2.linked_document_id = q.id
             and i2.type = 'facture'
             and i2.status <> 'annule'
        ), 0) as settled_total
        from public.documents inv
       where inv.linked_document_id = q.id
         and inv.type = 'facture'
         and inv.status <> 'annule'
    ) m on q.id is not null
   where d.share_token = p_token
     and d.status <> 'annule';
$fn$;

grant execute on function public.get_document_by_token(uuid) to anon, authenticated;
