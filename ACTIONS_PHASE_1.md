# ACTIONS_PHASE_1.md — Préparation Phase 1 (Module Billing SP Smart Sarl)

> Document de préparation **côté humain**. Tout ce que tu dois faire **avant** de
> taper `OK Phase 1` à ton retour. Stack cible : **Next.js 16 / React 19** (aligné
> sur l'existant, pas Next 14 comme écrit dans le brief).
>
> Légende : 🟢 obligatoire · ⚪ optionnel · ⚠️ action sensible/irréversible ·
> 🌐 visible client (PDF/site) · 🔒 interne (jamais affiché)
>
> ⏱️ Les durées sont estimées pour quelqu'un qui découvre les interfaces.

---

## 1. CRÉATION DU PROJET SUPABASE  🟢  ⏱️ ~10 min

### 1.1 Créer le compte / se connecter
1. Va sur **https://supabase.com** → bouton **Start your project** (ou **Sign in**).
2. Connecte-toi avec **GitHub** (recommandé : un seul identifiant pour tout) ou par email.
   - 💡 **Recommandation** : utilise le compte GitHub/email de l'entreprise, pas un perso jetable, car ce projet contiendra des données comptables réelles.

### 1.2 Créer le projet
3. Dans le dashboard, clique **New project**.
4. **Organization** : choisis (ou crée) une organisation, ex. `SP Smart Sarl`.
5. **Project name** : `spsmart-billing`.
6. **Database Password** : ⚠️ **génère un mot de passe fort** (clique **Generate a password**) et **copie-le immédiatement dans un gestionnaire de mots de passe**.
   - ⚠️ **IRRÉCUPÉRABLE** : ce mot de passe DB ne sera **plus jamais affiché**. Si tu le perds tu devras le réinitialiser. Ce n'est PAS le mot de passe de login admin du site.
7. **Region** : 🟢 **Recommandation pour le Cameroun → `West Europe (London)` `eu-west-2`** ou **`Frankfurt (eu-central-1)`**.
   - Justification : Supabase n'a pas de région Afrique. Londres/Francfort offrent la **latence la plus basse** vers l'Afrique centrale via les câbles sous-marins, et restent dans des juridictions à RGPD clair. **Évite `us-east` / régions Asie** (latence plus élevée depuis le Cameroun).
   - ➡️ Si tu hésites : **choisis Frankfurt (`eu-central-1`)**.
8. **Pricing plan** : **Free** suffit pour démarrer (backup 7 jours inclus, comme noté au brief).
9. Clique **Create new project** et attends ~2 min que le projet soit provisionné (statut « Setting up project… »).

### 1.3 Récupérer les 3 clés
10. Une fois le projet prêt, va dans **Project Settings** (⚙️ en bas de la barre latérale).
11. Onglet **API** (ou **Data API** / **API Keys** selon la version de l'UI) :
    - **Project URL** → c'est ton `NEXT_PUBLIC_SUPABASE_URL`
      (ressemble à `https://abcdefghijklmno.supabase.co`)
    - **`anon` / `public`** → c'est ton `NEXT_PUBLIC_SUPABASE_ANON_KEY` (long JWT, commence par `eyJ...`)
    - **`service_role`** → c'est ton `SUPABASE_SERVICE_ROLE_KEY`
      ⚠️ **SECRET ABSOLU** : cette clé contourne **toute** la sécurité RLS. Ne la colle JAMAIS dans un fichier `NEXT_PUBLIC_*`, ne la commit JAMAIS, ne l'envoie JAMAIS par WhatsApp/email en clair.

### 1.4 Coller les clés dans `.env.local`
12. À la **racine du projet** (`C:\Users\DELL PRO\Desktop\site_web`), ouvre le fichier **`.env.local`**.
    - S'il n'existe pas, **crée-le** (copie de `.env.example`). ⚠️ Ne touche pas à `.env.example` (versionné, sans secrets).
13. Ajoute / complète **exactement** ces lignes (remplace les valeurs entre `<>`) :

```dotenv
# === Module Billing — Supabase ===
NEXT_PUBLIC_SUPABASE_URL=<colle ici la Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<colle ici la clé anon/public>
SUPABASE_SERVICE_ROLE_KEY=<colle ici la clé service_role>

# Lien public de partage des factures (localhost en dev, spsmart.cm en prod)
# ⚠️ Cette variable EXISTE PEUT-ÊTRE DÉJÀ dans ton .env.local (utilisée par le
#    sitemap/SEO du site public). Si elle y est déjà → NE LA DUPLIQUE PAS,
#    garde la valeur existante (en dev: http://localhost:3000).
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ℹ️ **Vérifié dans ton projet** : `.env.local` existe déjà (clés Sanity, Resend, etc.)
> et `.env.example` déclare déjà `NEXT_PUBLIC_SITE_URL`. Tu n'as donc qu'à **ajouter les
> 3 lignes Supabase** ; ne touche pas aux autres variables existantes.

14. **Enregistre** le fichier.
    - ✅ Vérifie que `.env.local` est bien dans `.gitignore` (normalement oui). Tape dans un terminal : `git status` → `.env.local` ne doit **PAS** apparaître. ⚠️ S'il apparaît, **NE COMMIT PAS** et préviens-moi.

### 1.5 Vérifier que la connexion fonctionne
15. Vérif rapide (sans code) directement dans le dashboard : onglet **Table Editor** → tu dois voir une base vide mais accessible. Si l'UI répond, la base est en ligne.
16. ✅ La vérification applicative réelle (le site lit/écrit dans Supabase) **c'est moi qui la ferai** au lancement de la Phase 1. Tu n'as pas besoin de coder.

---

## 2. ACTIVATION MCP SUPABASE  ⚪ (recommandé)  ⏱️ ~5 min

Le **MCP Supabase** me permet de **piloter directement** ta base (créer les tables,
appliquer les migrations, exécuter le SQL) sans copier-coller manuel. **Fortement
recommandé** : gain de temps énorme et zéro erreur de copier-coller sur des migrations longues.

### Option A — Activer le MCP (recommandé)
1. Il te faut un **Personal Access Token** Supabase :
   - Va sur **https://supabase.com/dashboard/account/tokens**
   - **Generate new token** → nomme-le `claude-code-mcp` → **copie le token** (⚠️ affiché une seule fois).
2. À mon retour, j'utiliserai l'outil d'authentification du plugin Supabase déjà disponible dans cette session (`supabase` MCP). Tu n'as **rien à installer** : il me suffira de ce token (ou d'un login OAuth que je déclencherai).
   - 💡 Garde simplement le **Personal Access Token** prêt dans ton gestionnaire de mots de passe, et précise-moi (si tu veux limiter) le **project-ref** = l'identifiant dans ta Project URL (`abcdefghijklmno`).
3. ⚠️ Le MCP peut modifier/supprimer des données. Je ne lancerai **que** les migrations de la Phase 1, et je te ferai un récap de ce qui a été appliqué.

### Option B — Tu appliques le SQL toi-même (si tu préfères ne pas activer le MCP)
1. À mon retour, je te déposerai les fichiers de migration dans **`supabase/migrations/*.sql`**.
2. Tu les appliqueras ainsi :
   - Dashboard Supabase → **SQL Editor** → **New query** → colle le contenu d'un fichier → **Run**.
   - Applique les fichiers **dans l'ordre des numéros** (`0001_...`, `0002_...`, etc.).
   - ⚠️ N'exécute pas deux fois la même migration sans regarder : certaines créent des tables (échoueront si déjà créées — c'est normal, lis le message).
3. Alternative CLI (avancé) : installer le **Supabase CLI** (`npm i -g supabase`), `supabase link --project-ref <ref>`, puis `supabase db push`. Non requis si tu utilises le SQL Editor.

➡️ **Ma recommandation : Option A (MCP).** Prépare juste le Personal Access Token.

---

## 3. FORMULAIRE À REMPLIR — Coordonnées légales SP Smart Sarl  🟢  ⏱️ ~10 min

> Remplis **tout en une fois** ci-dessous, puis colle-moi ce bloc complété à ton retour
> (ou dépose-le dans un fichier `organization.txt` à la racine). J'en ferai le seed de la table `organizations`.
> Remplace les `""` vides. Laisse vide un champ optionnel inconnu (je mettrai `NULL`).

```ini
# ───────── IDENTITÉ ─────────
name            = ""   # 🟢 🌐  Raison sociale exacte. Ex: "SP SMART SARL"
legal_form      = ""   # 🟢 🌐  Forme juridique. Ex: "SARL"
niu             = ""   # 🟢 🌐  Numéro Identifiant Unique fiscal (Cameroun). Ex: "M0XXXXXXXXXXX P"
rccm            = ""   # 🟢 🌐  Registre Commerce. Ex: "RC/DLA/2023/B/1234"
capital         = ""   # ⚪ 🌐  Capital social en FCFA. Ex: "1 000 000"
fiscal_regime   = "simplifie"  # 🟢 🔒  Régime fiscal. Défaut: "simplifie"

# ───────── CONTACT / ADRESSE ─────────
address         = ""   # 🟢 🌐  Adresse physique complète. Ex: "Akwa, Rue X, Douala, Cameroun"
phone           = ""   # 🟢 🌐  Téléphone pro affiché. Ex: "+237 6XX XX XX XX"
email           = ""   # 🟢 🌐  Email pro affiché. Ex: "contact@spsmart.cm"
website         = ""   # ⚪ 🌐  Site web. Ex: "https://spsmart.cm"

# ───────── COORDONNÉES BANCAIRES (pied de PDF) ─────────
bank_name       = ""   # ⚪ 🌐  Nom de la banque. Ex: "Afriland First Bank"
bank_account    = ""   # ⚪ 🌐  N° de compte / RIB / IBAN. Ex: "10005 00012 12345678901 23"
bank_bic        = ""   # ⚪ 🌐  Code BIC/SWIFT. Ex: "CCEICMCX"

# ───────── MOBILE MONEY (paiement client) ─────────
momo_mtn        = ""   # ⚪ 🌐  Numéro MoMo MTN. Ex: "+237 67X XX XX XX"
momo_orange     = ""   # ⚪ 🌐  Numéro Orange Money. Ex: "+237 69X XX XX XX"
```

**Notes :**
- 🌐 = ces champs apparaîtront sur les **PDF** (en-tête, pied de page, conditions) — vérifie l'orthographe exacte.
- 🔒 `fiscal_regime` sert à la logique interne (mention TVA/régime), pas affiché tel quel.
- Les `logo_url`, `signature_url`, `stamp_url` ne sont **pas** à remplir ici → voir **section 5** (upload fichiers).

---

## 4. CONFIGURATION DU PREMIER USER ADMIN  🟢  ⏱️ ~5 min

### 4.1 Quel email ?
| Email | Avis |
|---|---|
| `gaetanboristanedoum@gmail.com` | Compte personnel — lié à une personne. |
| `spsmartsarl@gmail.com` | Compte **entreprise** — lié à la structure. |

➡️ **Recommandation : `spsmartsarl@gmail.com`.**
**Pourquoi** : un accès comptable doit appartenir à l'**entreprise**, pas à un individu. Si la personne change, part, ou perd son téléphone, l'accès survit. Tu pourras **ensuite** inviter `gaetanboristanedoum@gmail.com` comme second admin (la table `profiles` gère plusieurs users / rôles `admin|manager|viewer`).
- ✅ Assure-toi simplement d'avoir **accès à la boîte `spsmartsarl@gmail.com`** (pour recevoir les emails de confirmation/réinitialisation).

### 4.2 Mot de passe initial vs Magic Link ?
➡️ **Recommandation : Magic Link (lien de connexion par email) + Email/Mot de passe en secours.**
**Pourquoi, en mobilité au Cameroun** :
- Le **magic link** évite de taper un mot de passe complexe sur mobile (souvent en chantier, clavier tactile) et **supprime le risque de mot de passe faible/réutilisé** — c'est le plus sûr au quotidien.
- ⚠️ Limite : le magic link **dépend de l'accès à la boîte mail**. Donc on garde **aussi** un mot de passe fort comme **filet de secours** (réseau data instable → l'email peut tarder).
- 👉 Concrètement : Supabase Auth (email/mdp) est activé par défaut ; le magic link s'active en 1 clic (voir ci-dessous). On aura les deux.

### 4.3 Comment créer le user — étape par étape
1. Dashboard Supabase → barre latérale **Authentication** → onglet **Users**.
2. Bouton **Add user** → **Create new user**.
3. **Email** : `spsmartsarl@gmail.com` (ou ton choix).
4. **Password** : ⚠️ génère un mot de passe fort, **copie-le dans ton gestionnaire**.
5. Coche **Auto Confirm User** (sinon le compte reste « en attente de confirmation »).
6. **Create user**.
7. (Magic link) → **Authentication** → **Providers** → vérifie que **Email** est **Enabled** ; dans **Authentication → Sign In / Providers / Email**, garde **« Confirm email »** activé et **« Magic Link »** disponible (activé par défaut sur le provider Email).
8. ⚠️ **Important** : à ce stade le user existe dans `auth.users`, mais sa ligne dans la table métier **`profiles`** (avec `organization_id` + `role = "admin"`) sera créée **par ma migration/seed** à la Phase 1. Tu n'as **rien** à faire côté `profiles`.
9. 🔒 **URL de login** : l'admin sera sur **`/admin/billing/login`** (je le construis en Phase 1).

---

## 5. UPLOAD DES ASSETS BRANDING  ⚪ (mais autant le préparer)  ⏱️ ~10 min

> Ces 3 images apparaissent sur les PDF. Tu peux les préparer maintenant ; l'upload réel
> se fera via l'écran **`/admin/billing/parametres/signature`** (Phase 3) **ou** je les
> chargerai dans le bucket Storage **`branding`** à mon retour si tu me donnes les fichiers.

| Asset | Format recommandé | Détails |
|---|---|---|
| **Logo SP Smart** | **SVG** (idéal) ou **PNG transparent** | Fond transparent, ~512 px de haut min. Sert à l'en-tête PDF. |
| **Signature manuscrite** | **PNG transparent** | Signature scannée/photographiée **détourée** (fond enlevé). Largeur ~600 px. |
| **Cachet rond** | **PNG transparent** | Tampon de l'entreprise détouré. ~600×600 px. |

**Comment préparer / déposer :**
1. Scanne ou photographie signature + cachet sur **fond blanc**, bien à plat, bien éclairé.
2. Détoure le fond (rends-le transparent) : outil gratuit **https://www.remove.bg** ou Photopea (**https://www.photopea.com**).
3. Exporte en **PNG transparent**.
4. Dépose les 3 fichiers dans un dossier **`C:\Users\DELL PRO\Desktop\site_web\branding-assets\`** (crée-le) :
   - `logo.svg` (ou `logo.png`)
   - `signature.png`
   - `cachet.png`
5. ⚠️ Ces fichiers ne doivent **pas** être commités s'ils sont confidentiels (la signature surtout). Je gérerai leur placement (Supabase Storage, bucket privé `branding`).
- ⚪ Si tu n'as pas le temps : **ce n'est pas bloquant pour la Phase 1**. Les PDF afficheront simplement le libellé « Pour SP Smart Sarl » sans image tant que rien n'est uploadé.

---

## 6. ✅ CHECKLIST FINALE AVANT DE TAPER « OK Phase 1 »

Coche tout. Les `🟢` sont **bloquants** ; les `⚪` sont confort.

- [ ] 🟢 Projet Supabase créé (région **Frankfurt/Londres**)
- [ ] 🟢 Mot de passe **DB** sauvegardé dans le gestionnaire de mots de passe (⚠️ irrécupérable)
- [ ] 🟢 `NEXT_PUBLIC_SUPABASE_URL` collée dans `.env.local`
- [ ] 🟢 `NEXT_PUBLIC_SUPABASE_ANON_KEY` collée dans `.env.local`
- [ ] 🟢 `SUPABASE_SERVICE_ROLE_KEY` collée dans `.env.local` (⚠️ jamais commitée / jamais en `NEXT_PUBLIC_`)
- [ ] 🟢 `NEXT_PUBLIC_SITE_URL` présent dans `.env.local` (déjà là dans ton cas → laisser `http://localhost:3000` en dev)
- [ ] 🟢 `git status` ne montre **pas** `.env.local`
- [ ] 🟢 Bloc **coordonnées légales** (section 3) rempli et prêt à me coller
- [ ] 🟢 Premier user admin créé dans Authentication → Users (**Auto Confirm** coché)
- [ ] 🟢 Accès confirmé à la boîte mail de l'admin (pour magic link / reset)
- [ ] ⚪ **Personal Access Token** Supabase généré (si tu veux que je pilote via MCP)
- [ ] ⚪ `project-ref` noté (l'ID dans la Project URL)
- [ ] ⚪ Logo / signature / cachet préparés en PNG transparent dans `branding-assets/`

➡️ Quand les `🟢` sont cochés : reviens, colle-moi le **bloc section 3** (+ le token MCP si Option A), et tape **`OK Phase 1`**.

---

## 7. CE QUE JE FERAI DÈS TON « OK Phase 1 » (5 lignes)

1. J'écris toutes les **migrations SQL** (`supabase/migrations/`) : tables (`organizations`, `profiles`, `clients`, `categories`, `documents`, `document_lines`, `payments`, `category_stats`), **triggers** (numérotation, montant en lettres, share_token, compteurs) et **RLS stricte** par `organization_id`.
2. Je **seed** `organizations` avec tes coordonnées légales, les **9 catégories** de services, et je rattache ton user admin à un `profiles` (role `admin`).
3. Je crée les **clients Supabase** (`lib/supabase/client.ts`, `server.ts`, middleware) + l'intégration `@supabase/ssr` adaptée **Next.js 16**.
4. Je construis le **layout `/admin/billing`** (AuthGuard + sidebar) et la **page login** (`/admin/billing/login`) avec email/mdp + magic link, plus les chaînes i18n FR/EN.
5. Je **vérifie** que le login fonctionne et que la RLS bloque tout accès non authentifié, puis **STOP** + récap avant la Phase 2.

---

## ⏱️ TEMPS TOTAL ESTIMÉ : ~45 minutes
*(Supabase 10 + MCP 5 + légales 10 + admin 5 + branding 10 + checklist 5. Hors branding : ~35 min.)*
