# Guide de déploiement — SP Smart Sarl

Ce guide met le site **en ligne** sur Vercel (hébergement gratuit pour
démarrer), connecté à Sanity. Suivez les étapes **dans l'ordre**.

Durée : ~30 minutes. Aucune compétence de développeur requise, mais soyez
méthodique et gardez vos identifiants à portée.

---

## Vue d'ensemble

```
Code (GitHub)  ─▶  Vercel (héberge le site)  ◀─▶  Sanity (contenu)
                          │
                     Resend (emails)
```

---

## Étape 1 — Mettre le code sur GitHub

1. Créez un compte sur https://github.com (gratuit) avec l'email entreprise.
2. Créez un **nouveau dépôt privé** nommé `sp-smart-website` (sans README).
3. Dans un terminal, à la racine du projet :

```bash
git remote add origin https://github.com/VOTRE-COMPTE/sp-smart-website.git
git branch -M main
git push -u origin main
```

> Le premier commit a déjà été créé par l'équipe technique.

---

## Étape 2 — Préparer Sanity pour la production

1. Allez sur https://www.sanity.io/manage/project/9b9fzjxq
2. **API → CORS origins → Add origin** :
   - Ajoutez l'URL du futur site (ex. `https://sp-smart.vercel.app` et,
     plus tard, `https://www.spsmart.cm`)
   - Cochez **Allow credentials**
3. **API → Tokens → Add API token** :
   - Nom : `Site web - écriture` — Permissions : **Editor**
   - **Copiez le token** (affiché une seule fois) → ce sera
     `SANITY_API_WRITE_TOKEN`
   - (Optionnel) créez un token **Viewer** pour `SANITY_API_READ_TOKEN`

---

## Étape 3 — Créer les comptes de services

| Service | Lien | Variable obtenue |
|---|---|---|
| **Resend** (emails devis/contact) | https://resend.com | `RESEND_API_KEY` |
| **hCaptcha** (anti-spam, optionnel) | https://www.hcaptcha.com | `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `HCAPTCHA_SECRET_KEY` |
| **Google Maps** (carte contact, optionnel) | https://console.cloud.google.com | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

> Resend : créez un compte, **vérifiez un domaine** (ou utilisez l'adresse
> de test), puis créez une **API Key**. Renseignez aussi `RESEND_FROM_EMAIL`
> (expéditeur vérifié) et `RESEND_TO_EMAIL` (qui reçoit les demandes).

---

## Étape 4 — Déployer sur Vercel

1. Créez un compte sur https://vercel.com (connectez-le à GitHub).
2. **Add New → Project** → importez le dépôt `sp-smart-website`.
3. Vercel détecte **Next.js** automatiquement — ne changez rien.
4. Dépliez **Environment Variables** et ajoutez **toutes** les variables
   (voir le tableau ci-dessous).
5. Cliquez **Deploy**. Patientez ~2 min.
6. Vercel donne une URL `https://sp-smart-xxxx.vercel.app`.

### Variables d'environnement à renseigner sur Vercel

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `9b9fzjxq` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` |
| `SANITY_API_READ_TOKEN` | (token Viewer, ou vide si dataset public) |
| `SANITY_API_WRITE_TOKEN` | (token Editor — étape 2) |
| `SANITY_REVALIDATE_SECRET` | une longue chaîne secrète au hasard |
| `RESEND_API_KEY` | (clé Resend) |
| `RESEND_FROM_EMAIL` | expéditeur vérifié (ex. `contact@spsmart.cm`) |
| `RESEND_TO_EMAIL` | qui reçoit les demandes |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | (site key hCaptcha, optionnel) |
| `HCAPTCHA_SECRET_KEY` | (secret hCaptcha, optionnel) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | (clé Google Maps, optionnel) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | (Google Analytics, optionnel) |
| `NEXT_PUBLIC_SITE_URL` | l'URL finale du site (ex. `https://www.spsmart.cm`) |

> Après avoir obtenu l'URL Vercel : revenez **Étape 2** ajouter cette URL
> dans les CORS Sanity, et mettez à jour `NEXT_PUBLIC_SITE_URL`, puis
> **redéployez** (Vercel → Deployments → Redeploy).

---

## Étape 5 — Domaine personnalisé (optionnel)

1. Vercel → projet → **Settings → Domains** → ajoutez `www.spsmart.cm`
2. Suivez les instructions DNS (chez votre registrar de domaine)
3. Mettez à jour `NEXT_PUBLIC_SITE_URL` et les **CORS Sanity** avec ce domaine
4. Redéployez

---

## Étape 6 — Vérifications après mise en ligne

- [ ] La page d'accueil s'affiche avec le contenu
- [ ] `/studio` est accessible et la connexion fonctionne
- [ ] Le sélecteur de langue FR/EN fonctionne
- [ ] Un test de formulaire **devis** : email reçu + fiche créée dans
      `/studio` (Demandes de devis)
- [ ] `https://VOTRE-SITE/sitemap.xml` et `/robots.txt` répondent
- [ ] Le bouton WhatsApp ouvre la bonne conversation

---

## Mises à jour futures

- **Modifier le contenu** : via `/studio` (voir `GUIDE-CONTENU.md`) — aucun
  redéploiement nécessaire, c'est instantané.
- **Modifier le code** : un `git push` sur `main` redéploie automatiquement.

---

## Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| Studio : erreur de connexion | URL absente des CORS Sanity | Étape 2, ajouter l'URL + credentials |
| Le contenu ne s'affiche pas | `NEXT_PUBLIC_SANITY_*` manquantes | Vérifier les variables Vercel + redéployer |
| Pas d'email reçu | `RESEND_API_KEY`/expéditeur non vérifié | Vérifier Resend + variables |
| Build échoue sur Vercel | variable manquante | Lire le log Vercel, ajouter la variable |
