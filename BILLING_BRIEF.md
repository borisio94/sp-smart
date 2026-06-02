# Module Billing SP Smart Sarl — Brief technique complet

## 🎯 Objectif

Ajouter au site SP Smart Sarl un **module interne de gestion commerciale** permettant de créer, gérer et envoyer 5 types de documents commerciaux professionnels (devis, proforma, bon de commande, facture, reçu de paiement), avec suivi des statuts, paiements partiels/totaux, signature numérique, lien privé de téléchargement, et compteur public de réalisations par catégorie sur le site.

## 🏗️ Architecture technique

### Stack imposée
- **Frontend** : Next.js 14 App Router (existant)
- **Base de données** : Supabase (Postgres + Auth + Storage)
- **Auth admin** : Supabase Auth — email/mot de passe — RLS strict
- **Génération PDF** : `@react-pdf/renderer` (rendu serveur, fidèle au design validé)
- **Stockage fichiers** : Supabase Storage (PDFs générés, signatures, cachets, scans factures historiques)
- **UI** : shadcn/ui + Tailwind (cohérent avec le reste du site)
- **Formulaires** : React Hook Form + Zod (cohérent avec /devis, /rendez-vous)
- **Liens privés** : tokens UUID v4 dans URL `/facture-privee/[token]`

### Variables d'environnement à ajouter dans `.env.local` et `.env.example`
```
# Module billing — Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Lien public partage facture (sera spsmart.cm en prod)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Architecture des dossiers

```
src/
├── app/
│   ├── (admin)/
│   │   └── billing/
│   │       ├── layout.tsx              # AuthGuard + sidebar admin
│   │       ├── page.tsx                # Dashboard : KPIs + derniers documents
│   │       ├── login/page.tsx          # Login Supabase Auth
│   │       ├── documents/
│   │       │   ├── page.tsx            # Liste filtrable tous documents
│   │       │   ├── nouveau/page.tsx    # Création nouveau document
│   │       │   ├── [id]/page.tsx       # Détail + édition
│   │       │   └── [id]/pdf/route.ts   # Génération PDF à la volée
│   │       ├── clients/
│   │       │   ├── page.tsx            # Liste clients (CRM léger)
│   │       │   └── [id]/page.tsx       # Fiche client
│   │       ├── paiements/
│   │       │   └── page.tsx            # Suivi paiements
│   │       ├── historique/
│   │       │   └── page.tsx            # Saisie documents antérieurs au site
│   │       └── parametres/
│   │           ├── page.tsx            # Coordonnées entreprise, RIB, etc.
│   │           ├── signature/page.tsx  # Upload signature + cachet
│   │           └── categories/page.tsx # Gestion catégories d'exécution
│   └── (public)/
│       └── facture-privee/
│           └── [token]/page.tsx        # Page publique avec téléchargement PDF
├── lib/
│   ├── billing/
│   │   ├── pdf/
│   │   │   ├── DocumentPDF.tsx         # Composant @react-pdf/renderer principal
│   │   │   ├── Header.tsx              # En-tête commun (logo + identité)
│   │   │   ├── TitleBand.tsx           # Bandeau bleu plein avec type + numéro
│   │   │   ├── RecipientBlock.tsx      # Bloc Destinataire/Objet
│   │   │   ├── ArticlesTable.tsx       # Tableau articles (mode tableau)
│   │   │   ├── FreeTextBody.tsx        # Corps texte libre (mode texte)
│   │   │   ├── TotalsBlock.tsx         # Totaux + Net à payer
│   │   │   ├── AmountInWords.tsx       # Montant en lettres
│   │   │   ├── Conditions.tsx          # Modalités + délais/garantie
│   │   │   ├── Signatures.tsx          # Blocs signature + cachet
│   │   │   ├── Footer.tsx              # Pied gris + filet bleu
│   │   │   └── Watermark.tsx           # Filigrane SP
│   │   ├── numbering.ts                # Génération N° docs (PRO-2026-0142)
│   │   ├── amountToWords.ts            # Convertit montant en lettres FR
│   │   ├── status-machine.ts           # Transitions de statuts autorisées
│   │   ├── share-token.ts              # Génération/validation tokens publics
│   │   └── types.ts                    # Types TS partagés
│   └── supabase/
│       ├── client.ts                   # Client browser
│       ├── server.ts                   # Client serveur (Service Role)
│       └── middleware.ts               # Auth middleware
└── components/
    └── billing/
        ├── DocumentForm.tsx            # Formulaire création/édition
        ├── ArticlesEditor.tsx          # Éditeur lignes du tableau
        ├── ClientPicker.tsx            # Sélecteur client (autocomplete)
        ├── StatusBadge.tsx             # Badge coloré statut
        ├── PaymentRecorder.tsx         # Formulaire enregistrement paiement
        └── DocumentCard.tsx            # Carte document dans la liste
```

## 🗄️ Schéma base de données Supabase

### Tables principales

**`organizations`** (singleton pour SP Smart, prévu multi-tenant futur)
- id, name, niu, rccm, capital, address, phone, email, website
- bank_name, bank_account, bank_bic, momo_mtn, momo_orange
- logo_url, signature_url, stamp_url (Supabase Storage)
- legal_form, fiscal_regime ("simplifie" ici)
- created_at, updated_at

**`profiles`** (users qui se connectent à /admin)
- id (FK Supabase auth.users), organization_id, full_name, role ("admin" | "manager" | "viewer")
- created_at

**`clients`** (carnet d'adresses CRM léger)
- id, organization_id, name, type ("particulier" | "entreprise" | "institution")
- email, phone, whatsapp, address
- contact_person (si entreprise)
- notes
- created_at, updated_at

**`categories`** (catégories d'exécution paramétrables)
- id, organization_id, slug, name_fr, name_en, lucide_icon, color, order, active
- Seed initial à partir des 9 services du site :
  motorisation-portails, motorisation-volets, videosurveillance, securite-incendie,
  anti-intrusion, cloture-electrique, controle-acces, electricite, solaire

**`documents`** (cœur du module)
- id, organization_id, client_id, category_id, created_by (profile_id)
- type : enum ("devis" | "proforma" | "bon_commande" | "facture" | "recu")
- number : string (PRO-2026-0142) — unique par type+année
- year, sequence : int (pour générer le numéro)
- issue_date, validity_date (nullable selon type)
- title : string (ex: "Vidéosurveillance villa privée")
- subject : string (ex: "Étude — automatisation portail")
- body_mode : enum ("table" | "text")
- body_text : text (utilisé si mode "text")
- materials_subtotal, labor_amount, discount_amount, total_amount : numeric(12,0)
- amount_in_words : text (généré auto, modifiable)
- payment_terms : text (modalités acompte/solde)
- delivery_terms : text (délais + garantie)
- status : enum ("brouillon" | "envoye" | "confirme" | "termine" | "annule")
- payment_status : enum ("non_paye" | "acompte" | "partiel" | "paye_total" | "rembourse")
- share_token : uuid (pour lien public)
- pdf_url : text (Supabase Storage cache, regénéré si modif)
- linked_document_id : uuid (proforma → facture, devis → proforma, etc.)
- is_historical : boolean (saisie a posteriori, antérieure au site)
- notes_internes : text (visibles seulement en admin)
- created_at, updated_at, sent_at, confirmed_at, completed_at, cancelled_at

**`document_lines`** (lignes du tableau, si body_mode = "table")
- id, document_id, position, designation, quantity, unit_price, line_total

**`payments`** (paiements reçus pour les factures)
- id, document_id, amount, method (enum: "especes" | "momo_mtn" | "momo_orange" | "virement" | "cheque" | "carte")
- reference : text (référence transaction MoMo, n° chèque, etc.)
- received_at, recorded_by (profile_id), notes
- created_at

**`category_stats`** (compteurs incrémentés à la complétion)
- category_id (PK), realized_count, total_revenue
- updated_at

→ Trigger Postgres : quand `documents.status` passe à "termine" pour la première fois,
  incrémenter `realized_count` de la catégorie liée et `total_revenue` du montant.
  Décrémenter si retour de "termine" vers un autre statut.

### Row Level Security (RLS) — critique

- `organizations`, `profiles`, `clients`, `categories`, `documents`, `document_lines`, `payments`, `category_stats` :
  → SELECT/INSERT/UPDATE/DELETE autorisé UNIQUEMENT si `organization_id` = celle du `profile` authentifié
- Lecture publique sur `documents` UNIQUEMENT si `share_token` correspond au paramètre URL
- `category_stats` : lecture publique du `realized_count` (pour le compteur public sur le site)

### Triggers à créer

1. `tr_doc_complete_increment` : sur passage `status = "termine"` → incrémente `category_stats`
2. `tr_doc_uncomplete_decrement` : sur retour depuis "termine" → décrémente
3. `tr_doc_numbering` : auto-génération du `number` à l'insertion selon type + année + dernière sequence
4. `tr_doc_amount_in_words` : si `amount_in_words` est NULL, auto-générer à partir de `total_amount`
5. `tr_doc_share_token` : auto-génération du `share_token` à la création

## 📄 Génération PDF — Design final validé

### Source de vérité
Le design validé est le mix V1+V3 (référence : conversation Claude où l'utilisateur a validé "mixe V1 et V3"). Caractéristiques visuelles à reproduire fidèlement avec `@react-pdf/renderer` :

**Couleurs**
- Bleu corporate : `#0f3a8c`
- Bleu nuit : `#0a2a6b` (pour Bon de commande)
- Vert reçu : `#15803d` (pour Reçu de paiement)
- Rouge remise : `#b91c1c`
- Gris pied de page : `#f1f5f9`
- Gris texte : `#475569`, `#64748b`, `#94a3b8`
- Texte principal : `#1a2332`

**Couleur du bandeau titre selon type**
- DEVIS, PROFORMA, FACTURE → `#0f3a8c` (bleu corporate)
- BON DE COMMANDE → `#0a2a6b` (bleu nuit)
- REÇU DE PAIEMENT → `#15803d` (vert)

**Structure (de haut en bas)**
1. Filet bleu épais en haut (4 px, couleur du type)
2. En-tête : logo SP encadré gauche + bloc identité droite
3. Bandeau titre plein (type + numéro + date d'émission)
4. Bloc Destinataire / Objet (2 colonnes aérées, labels en petites maj grises)
5. Corps :
   - Mode tableau : en-tête bleu plein, lignes alternées bleu très clair
   - Mode texte : prose structurée avec mots-clés en bleu
6. Totaux empilés à droite (Total matériel, Main d'œuvre, Remise globale)
7. Bandeau "NET À PAYER" plein, pleine largeur
8. Montant en lettres en italique avec filet
9. Conditions (Modalités paiement + Délais/garantie) en 2 blocs aérés
10. Signatures (2 colonnes : SP Smart cachet + Bon pour accord client)
    → Si signature/cachet uploadés en paramètres, les afficher au-dessus du libellé
11. Pied de page : fond gris + filet bleu épais en haut, ligne paiement + ligne légale
12. Filigrane "SP" en bas-droite, 5 % d'opacité, rotation -18°

**Format final**
- A4 portrait
- Marges : 0 (tout est géré en interne par les composants)
- Polices : utiliser des polices web safe ou register Inter via `Font.register()`
- Numéros formatés `Intl.NumberFormat('fr-FR')` (espaces fines)
- Devise : "FCFA" partout, jamais "XAF" ou "€"

### Signature et cachet
- L'utilisateur upload **2 images séparées** dans `/admin/billing/parametres/signature` :
  - Signature manuscrite scannée (PNG transparent recommandé)
  - Cachet rond de l'entreprise (PNG transparent recommandé)
- Stockées dans Supabase Storage bucket `branding`
- Affichées dans le bloc Signatures du PDF (au-dessus du libellé "Pour SP Smart Sarl")
- Possibilité de désactiver l'affichage par document (champ `include_signature` boolean default true)

## 🔢 Numérotation automatique

Format : `<PREFIX>-<ANNEE>-<SEQ>` avec sequence sur 4 chiffres :
- DEVIS → `DEV-2026-0001`
- PROFORMA → `PRO-2026-0001`
- BON DE COMMANDE → `BCO-2026-0001`
- FACTURE → `FAC-2026-0001`
- REÇU → `REC-2026-0001`

Chaque type a sa propre séquence indépendante. Reset chaque année (1er janvier).

Pour la **saisie historique**, permettre la saisie manuelle du numéro avec validation d'unicité (pour reproduire les vieux numéros).

## 🔀 Machine d'états (statuts)

### Statuts du document
```
brouillon → envoye → confirme → termine
              ↓         ↓
            annule    annule
```

Transitions autorisées :
- `brouillon` → `envoye`, `annule`
- `envoye` → `confirme`, `annule`, `brouillon` (retour édition)
- `confirme` → `termine`, `annule`
- `termine` → `confirme` (correction exceptionnelle, demande confirmation)
- `annule` → `brouillon` (ré-ouverture)

### Statuts de paiement (factures uniquement)
```
non_paye → acompte → partiel → paye_total
                                    ↓
                              rembourse
```

Calcul automatique :
- Somme `payments.amount` = 0 → `non_paye`
- 0 < Somme < `total_amount` × 0.5 → `acompte`
- `total_amount` × 0.5 ≤ Somme < `total_amount` → `partiel`
- Somme ≥ `total_amount` → `paye_total`
- Présence d'un paiement négatif → `rembourse`

## 🎨 UI Admin — Spécifications

### Dashboard `/admin/billing`
- 4 cartes KPI en haut : Total documents ce mois, CA confirmé ce mois, Documents en attente, Impayés
- Liste des 10 derniers documents (tous types)
- Graphique simple : documents par mois (3 derniers mois)

### Liste documents `/admin/billing/documents`
- Filtres : type, statut, statut paiement, catégorie, date, client, recherche libre
- Colonnes : N°, Type (badge), Client, Catégorie, Date, Total, Statut, Paiement, Actions
- Actions par ligne : Voir, Éditer, Télécharger PDF, Copier lien partage, Dupliquer, Convertir (devis→proforma, proforma→facture)

### Création document `/admin/billing/documents/nouveau`
Workflow multi-étapes :
1. **Type** : choisir parmi 5 types
2. **Client** : sélectionner existant ou créer nouveau
3. **Catégorie** : choisir parmi les catégories actives
4. **Mode corps** : Tableau OU Texte libre
5. **Contenu** : selon mode choisi
6. **Totaux** : main d'œuvre + remise globale
7. **Conditions** : modalités paiement + délais/garantie (templates pré-remplis modifiables)
8. **Aperçu PDF** avant validation
9. **Enregistrer comme brouillon** OU **Enregistrer et envoyer**

### Édition `/admin/billing/documents/[id]`
- Affichage récap + accès actions selon statut
- Bouton "Télécharger PDF"
- Bouton "Copier lien WhatsApp" : génère message pré-rempli `Bonjour, voici votre [type] : [lien-prive]`
- Bouton "Marquer comme envoyé" / "Marquer comme confirmé" / "Marquer comme terminé"
- Section paiements (si facture) : historique + bouton "Enregistrer un paiement"
- Section "Documents liés" : afficher le devis source si proforma générée depuis, etc.

### Saisie historique `/admin/billing/historique`
- Interface allégée pour saisir rapidement les factures antérieures
- Champs minimaux : type, client, date, total, statut (souvent "terminé" + payé), catégorie
- Permet d'attacher un scan PDF/image du document original
- Compte dans les statistiques par catégorie (incrémente les compteurs)
- Indicateur visuel "Historique" pour les distinguer

### Paramètres `/admin/billing/parametres`
- Coordonnées entreprise (préremplies depuis `organizations`)
- Templates par défaut : modalités de paiement, délais/garantie (réutilisés à chaque création)
- Upload logo (déjà dans Sanity, ici on duplique pour les PDF — ou on récupère depuis Sanity)
- Upload signature et cachet
- Gestion catégories (CRUD)
- Gestion utilisateurs (inviter par email)

## 🔗 Lien privé client

Format URL : `https://spsmart.cm/facture-privee/[share_token]`

Page publique :
- Pas d'auth requise
- Affiche un aperçu HTML du document (pas le PDF directement, plus accessible mobile)
- Bouton "Télécharger en PDF"
- Bouton "Contacter SP Smart" → WhatsApp pré-rempli
- Si statut "annule" → page neutre "Document indisponible"
- Token rotativé si compromis (bouton "Régénérer le lien" en admin)

Génération message WhatsApp depuis l'admin :
```
Bonjour [Nom client],

Veuillez trouver votre [type de document] N° [numéro] :
[lien-privé]

Montant : [total] FCFA
Validité : [date] (pour devis/proforma)

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe SP Smart Sarl
```

Le bouton "Copier lien WhatsApp" ouvre `wa.me/<numéro_client>?text=<message_encodé>`.

## 📊 Compteur public sur le site

### Sur la page d'accueil et page "À propos"
Composant `<RealizationsCounter />` qui affiche :
- Total cumulé toutes catégories : "147 réalisations effectuées"
- Optionnellement, top 3 catégories : "32 portails motorisés · 41 systèmes de vidéosurveillance · 28 alarmes"

### Sur chaque page service
Composant `<ServiceRealizationsCount />` qui affiche pour la catégorie correspondante :
- "X installations réalisées"

### Implémentation
- Endpoint API `/api/billing/stats/public` (lecture seule, mise en cache 1h)
- Lit `category_stats.realized_count` (RLS lecture publique)
- Composant Server avec `revalidate: 3600`

## ⚠️ Sécurité

- RLS Supabase strict sur toutes les tables transactionnelles
- Service Role Key UNIQUEMENT côté serveur (jamais exposée au navigateur)
- Validation Zod sur toutes les inputs formulaires
- Sanitisation des entrées texte (le body_text peut contenir du markdown, l'échapper en PDF)
- Rate limiting sur l'endpoint public `/facture-privee/[token]` (10 req/min/IP)
- Logs des actions admin (création/édition/suppression) dans une table `audit_log` (optionnel phase ultérieure)
- Backup automatique Supabase (gratuit jusqu'à 7 jours sur free tier)

## 🎬 Phases d'exécution (procède dans cet ordre, STOP après chaque)

### Phase 1 — Fondations (Supabase + Auth)
1. Créer projet Supabase (ou réutiliser si existant). Demander confirmation et clés à l'utilisateur.
2. Définir toutes les tables, triggers et RLS dans `supabase/migrations/`
3. Configurer Supabase Auth (email/mot de passe)
4. Créer le layout `/admin/billing` avec AuthGuard + sidebar
5. Page login + redirection
6. Créer le premier user admin via SQL seed (instructions dans README)
7. **STOP** : vérifier login fonctionne, RLS active.

### Phase 2 — CRUD documents
1. Page liste documents avec filtres
2. Formulaire création multi-étapes (5 types, 2 modes corps)
3. Page détail/édition document
4. Numérotation automatique
5. Système de catégories
6. CRUD clients (carnet d'adresses)
7. **STOP** : vérifier création/édition d'un devis de bout en bout, sans PDF encore.

### Phase 3 — Génération PDF
1. Composants `@react-pdf/renderer` reproduisant fidèlement le design validé V1+V3
2. Route `/admin/billing/documents/[id]/pdf` qui stream le PDF
3. Upload signature + cachet en paramètres
4. Génération du nom de fichier `[type]-[numéro]-[client].pdf`
5. Conversion montant en lettres (fonction `amountToWords` testée)
6. **STOP** : vérifier qu'un PDF généré ressemble exactement au design validé.

### Phase 4 — Statuts et machine d'états
1. Composant StatusBadge avec transitions autorisées
2. Boutons d'action selon statut courant
3. Timestamps (sent_at, confirmed_at, completed_at)
4. Filtres par statut dans la liste
5. **STOP** : vérifier le cycle complet brouillon → terminé.

### Phase 5 — Paiements
1. Table `payments` + formulaire d'enregistrement
2. Calcul automatique du statut paiement
3. Historique des paiements sur la page facture
4. Génération automatique d'un reçu lors d'un paiement total
5. Filtre "Impayés" dans la liste
6. **STOP** : vérifier l'enregistrement d'un acompte puis du solde.

### Phase 6 — Lien privé + Compteur public + Historique
1. Page publique `/facture-privee/[token]` avec téléchargement PDF
2. Bouton "Copier lien WhatsApp" avec message pré-rempli
3. Compteur public sur home + page service
4. Module saisie historique
5. **STOP** : vérifier le partage WhatsApp, l'affichage du compteur, la saisie historique.

## 🚫 Règles non négociables (cohérence avec le reste du projet)

- **Zéro hard-coding** : tous les textes UI dans `messages/fr.json` + `messages/en.json` (l'admin sera principalement en français mais structurons-le i18n-ready)
- **TypeScript strict** : pas de `any`, pas de `@ts-ignore`
- **Server Components par défaut**, `"use client"` uniquement quand nécessaire (formulaires interactifs, etc.)
- **Commentaires en français**
- **shadcn/ui** pour tous les composants UI (cohérence avec /devis, /rendez-vous)
- **Lucide React** pour les icônes
- **Pas de logique métier dans les composants** — tout dans `lib/billing/`
- **Validation Zod systématique** sur les inputs
- **Toasts** (sonner ou shadcn toast) pour les feedbacks utilisateur

## 🎁 Bonus à prévoir (phase 6 ou ultérieure)

- Export CSV des documents (pour le comptable)
- Notifications email automatiques au client à la confirmation du devis (Resend, déjà configuré)
- Relances automatiques pour les impayés (cron Supabase Edge Functions)
- Dashboard mobile-responsive (l'utilisateur est souvent en chantier)
- PWA pour installer l'admin comme app sur le téléphone

## 📝 Avant de démarrer la Phase 1

1. Confirme que tu as bien compris le projet
2. Résume-moi en 10 lignes ce que tu vas construire
3. Liste les 6 phases dans l'ordre
4. Demande-moi les informations Supabase nécessaires (créer projet ou clés existantes ?)
5. Demande-moi les informations légales SP Smart Sarl à mettre dans `organizations` (NIU, RCCM, capital, RIB, etc.)
6. **N'écris aucune ligne de code avant ma validation explicite "OK Phase 1"**.
