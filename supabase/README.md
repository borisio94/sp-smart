# Supabase — Module Billing SP Smart Sarl

Base de données **transactionnelle** du module commercial (devis, proforma,
bon de commande, facture, reçu). **Aucune** de ces données ne vit dans Sanity —
Sanity reste réservé au contenu éditorial du site public.

## Contenu

```
supabase/
└── migrations/
    ├── 0001_initial_schema.sql              # types + tables + index
    ├── 0002_functions_triggers.sql          # numérotation, share_token, compteurs, updated_at
    ├── 0003_rls_policies.sql                # RLS stricte + RPC publics (token, stats)
    ├── 0004_seed_organization_and_categories.sql   # ⚠️ à personnaliser (coordonnées légales)
    └── 0005_seed_admin_profile.sql.template # ⚠️ à exécuter après création du user admin
```

## Ordre d'application (obligatoire)

1. `0001_initial_schema.sql`
2. `0002_functions_triggers.sql`
3. `0003_rls_policies.sql`
4. `0004_seed_organization_and_categories.sql` — **remplace les `A_REMPLIR`** par
   les vraies coordonnées légales (cf. `ACTIONS_PHASE_1.md` section 3) avant de l'exécuter.
5. Crée l'utilisateur admin dans **Authentication → Users** (Auto Confirm coché).
6. Renomme `0005_seed_admin_profile.sql.template` en `.sql`, adapte l'email, exécute-le.

## Comment appliquer

### Option A — MCP Supabase (recommandé, piloté par Claude)
Donne le Personal Access Token à Claude : il applique les migrations via le MCP,
dans l'ordre, et vérifie le résultat.

### Option B — SQL Editor (manuel)
Dashboard Supabase → **SQL Editor** → **New query** → colle le contenu d'un
fichier → **Run**. Répète dans l'ordre ci-dessus.

### Option C — Supabase CLI
```bash
npm i -g supabase
supabase link --project-ref <ton-project-ref>
supabase db push
```
(Le fichier `.template` n'est pas poussé par le CLI : applique-le à la main.)

## Vérifications post-application

- `select * from public.organizations;` → 1 ligne (coordonnées remplies)
- `select slug from public.categories order by "order";` → 9 catégories
- `select * from public.category_stats;` → 9 lignes à 0
- Table `documents` : insérer un devis de test, vérifier que `number` = `DEV-2026-0001`
  et que `share_token` est rempli automatiquement.
- RLS : sans session authentifiée, `select * from public.documents` doit renvoyer 0 ligne.

## Sécurité (rappel)

- `SUPABASE_SERVICE_ROLE_KEY` : **serveur uniquement** (jamais `NEXT_PUBLIC_`).
- Accès public : **uniquement** via les fonctions `get_document_by_token(uuid)` et
  `get_public_category_stats()` (SECURITY DEFINER, colonnes limitées). Le chiffre
  d'affaires (`total_revenue`) n'est **jamais** exposé publiquement.
