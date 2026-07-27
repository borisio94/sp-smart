-- ============================================================================
--  Module Billing SP Smart Sarl — 0017 : Signature électronique du client
-- ----------------------------------------------------------------------------
--  Le client destinataire d'un document partagé par lien privé (share_token)
--  peut apposer sa signature manuscrite (tracé au doigt / à la souris) depuis
--  la page publique /facture-privee/[token].
--
--  Preuve conservée (signature électronique simple, loi camerounaise
--  n° 2010/021 sur le commerce électronique) :
--    - signed_by_name / signed_by_email : identité déclarée par le signataire
--    - signed_at                        : horodatage serveur
--    - signature_ip / _user_agent       : contexte technique de la signature
--    - signature_doc_hash               : SHA-256 du contenu signé → rend toute
--                                         modification ultérieure détectable
--    - client_signature_url             : PNG du tracé (bucket privé)
--
--  L'écriture ne passe PAS par une policy anon : elle est faite côté serveur
--  par le route handler /facture-privee/[token]/signer avec la clé service
--  role. Aucun droit d'écriture n'est ouvert au rôle anon.
--  À appliquer APRÈS 0016.
-- ============================================================================

-- 1) Colonnes de signature sur les documents ────────────────────────────────
alter table public.documents
  add column if not exists signature_required   boolean not null default false,
  add column if not exists signed_at            timestamptz,
  add column if not exists signed_by_name       text,
  add column if not exists signed_by_email      text,
  add column if not exists client_signature_url text,
  add column if not exists signature_ip         text,
  add column if not exists signature_user_agent text,
  add column if not exists signature_doc_hash   text;

comment on column public.documents.signature_required is
  'L''émetteur demande la signature du client sur le lien privé (case du formulaire).';
comment on column public.documents.signed_at is
  'Horodatage serveur de la signature client (NULL = non signé).';
comment on column public.documents.signature_doc_hash is
  'SHA-256 du contenu signé (n°, date, client, lignes, totaux, conditions) : preuve d''intégrité.';
comment on column public.documents.client_signature_url is
  'Chemin du PNG du tracé dans le bucket privé « signatures ».';

-- Retrouver rapidement les documents en attente de signature.
create index if not exists idx_documents_signature_pending
  on public.documents (signature_required)
  where signed_at is null;

-- 2) Bucket privé pour les tracés de signature ──────────────────────────────
--    Privé : le PNG n'est lisible que par la clé service role (rendu PDF).
insert into storage.buckets (id, name, public)
  values ('signatures', 'signatures', false)
  on conflict (id) do nothing;

-- 3) get_document_by_token : exposer l'état de signature ────────────────────
--    Le type de retour change → il faut supprimer puis recréer la fonction.
--    On n'expose que ce dont la page publique a besoin : jamais l'IP,
--    le user-agent ni l'email du signataire.
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
  signed_by_name text
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
         d.signature_required, d.signed_at, d.signed_by_name
    from public.documents d
    left join public.clients c on c.id = d.client_id
    left join public.organizations o on o.id = d.organization_id
   where d.share_token = p_token
     and d.status <> 'annule';
$fn$;

grant execute on function public.get_document_by_token(uuid) to anon, authenticated;
