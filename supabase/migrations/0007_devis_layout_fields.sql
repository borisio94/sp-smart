-- ============================================================================
--  Module Billing — 0007 : Champs pour la mise en page « devis.docx »
-- ----------------------------------------------------------------------------
--  Rend 100% paramétrable le document fidèle au modèle Word de SP Smart :
--   - document_lines.unit         : colonne « Unité » (pièce, barre, m, paire…)
--   - documents.client_ref        : référence client (« Réf client »)
--   - documents.tax_rate          : taux de taxe/IR en % (paramétrable/document)
--   - documents.tax_amount        : montant de taxe calculé (FCFA)
--   - organizations.slogan        : slogan affiché sous le nom (en-tête)
--   - organizations.facebook      : page Facebook (pied de page)
--   - organizations.default_tax_rate : taux par défaut proposé à la création
--  Idempotent (ADD COLUMN IF NOT EXISTS). À appliquer APRÈS 0001.
-- ============================================================================

alter table public.document_lines
  add column if not exists unit text;

alter table public.documents
  add column if not exists client_ref text,
  add column if not exists tax_rate   numeric(5,2) not null default 0,
  add column if not exists tax_amount numeric(12,0) not null default 0;

alter table public.organizations
  add column if not exists slogan           text,
  add column if not exists facebook         text,
  add column if not exists default_tax_rate numeric(5,2) not null default 0;

-- Met à jour la fonction publique (lignes par token) pour exposer l'unité.
-- DROP nécessaire : on change le type de retour (ajout de la colonne unit).
drop function if exists public.get_document_lines_by_token(uuid);
create or replace function public.get_document_lines_by_token(p_token uuid)
returns table (
  "position" int,
  designation text,
  unit text,
  quantity numeric,
  unit_price numeric,
  line_total numeric
)
language sql
stable
security definer
set search_path = public
as $fn$
  select l.position, l.designation, l.unit, l.quantity, l.unit_price, l.line_total
    from public.document_lines l
    join public.documents d on d.id = l.document_id
   where d.share_token = p_token
     and d.status <> 'annule'
   order by l.position asc;
$fn$;

grant execute on function public.get_document_lines_by_token(uuid) to anon, authenticated;

-- Met à jour get_document_by_token pour exposer client_ref + tax.
-- DROP nécessaire : on change le type de retour (ajout de colonnes).
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
  client_ref text,
  body_mode public.body_mode,
  body_text text,
  materials_subtotal numeric,
  labor_amount numeric,
  discount_amount numeric,
  tax_rate numeric,
  tax_amount numeric,
  total_amount numeric,
  amount_in_words text,
  payment_terms text,
  delivery_terms text,
  status public.document_status,
  payment_status public.payment_status,
  client_name text,
  organization_name text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select d.id, d.type, d.number, d.issue_date, d.validity_date,
         d.title, d.subject, d.client_ref, d.body_mode, d.body_text,
         d.materials_subtotal, d.labor_amount, d.discount_amount,
         d.tax_rate, d.tax_amount,
         d.total_amount, d.amount_in_words, d.payment_terms, d.delivery_terms,
         d.status, d.payment_status,
         c.name as client_name,
         o.name as organization_name
    from public.documents d
    left join public.clients c on c.id = d.client_id
    left join public.organizations o on o.id = d.organization_id
   where d.share_token = p_token
     and d.status <> 'annule';
$fn$;

grant execute on function public.get_document_by_token(uuid) to anon, authenticated;
