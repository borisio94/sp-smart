# Site web — SP Smart Sarl

Site web professionnel de **SP Smart Sarl**, entreprise camerounaise spécialisée
dans la fourniture et l'installation d'équipements de sécurité et d'électricité.

Tout le contenu du site (textes, images, services, témoignages, promotions,
articles, coordonnées…) est géré depuis un **espace d'administration en ligne**
(Sanity Studio) — **aucune compétence technique n'est requise** pour modifier le
site au quotidien.

---

## 1. Ce dont vous avez besoin

| Outil | À quoi ça sert | Lien |
|-------|----------------|------|
| **Node.js 20 ou +** | Faire fonctionner le site sur votre ordinateur | https://nodejs.org |
| **Un éditeur de texte** (VS Code conseillé) | Voir et modifier les fichiers | https://code.visualstudio.com |
| **Un compte Sanity** | Gérer le contenu du site | https://www.sanity.io |
| **Un compte Resend** | Recevoir les emails des formulaires | https://resend.com |
| **Un compte Vercel** | Mettre le site en ligne | https://vercel.com |

> 💡 Les comptes Sanity, Resend et Vercel ont une offre gratuite suffisante
> pour démarrer.

---

## 2. Installation sur votre ordinateur (1ʳᵉ fois)

Ouvrez un **terminal** dans le dossier du projet, puis lancez ces commandes
**une par une** :

```bash
# 1. Installer les composants du site
npm install

# 2. Créer votre fichier de configuration
#    (copiez le modèle .env.example en .env.local)
copy .env.example .env.local      # sous Windows
# ou : cp .env.example .env.local  (sous Mac/Linux)
```

Ensuite, ouvrez le fichier **`.env.local`** avec votre éditeur de texte et
remplacez chaque valeur `A_REMPLIR` par les vraies clés (voir section 5).

---

## 3. Voir le site en local

```bash
npm run dev
```

Puis ouvrez votre navigateur sur **http://localhost:3000**.

L'espace d'administration du contenu sera disponible sur
**http://localhost:3000/studio** (mis en place en Phase 2).

Pour arrêter : revenez dans le terminal et appuyez sur `Ctrl + C`.

---

## 4. Commandes utiles

| Commande | Effet |
|----------|-------|
| `npm run dev` | Lance le site en mode développement (local) |
| `npm run build` | Prépare la version optimisée pour la mise en ligne |
| `npm run start` | Lance la version optimisée en local |
| `npm run lint` | Vérifie la qualité du code |

---

## 5. Les clés à renseigner dans `.env.local`

Chaque clé est expliquée directement dans le fichier `.env.example`.
Résumé :

- **Sanity** : identifiant du projet et jeton d'accès (créés sur sanity.io).
- **Resend** : clé d'API + adresses email d'envoi / de réception des devis.
- **hCaptcha** : protège les formulaires contre les robots spammeurs.
- **Google Maps** : affiche la carte sur la page Contact.
- **Analytics** : statistiques de visite (optionnel).

> ⚠️ Le fichier `.env.local` contient des informations **secrètes**.
> Il ne doit **jamais** être partagé ni publié. Il est déjà exclu de Git.

---

## 6. Mettre le site en ligne (déploiement)

Le guide détaillé pas-à-pas pour Vercel + Sanity sera fourni en **Phase 8**.
En résumé : on connecte le projet à Vercel, on y recopie les clés du
`.env.local`, et chaque mise à jour du contenu se fait ensuite directement
depuis l'administration en ligne, sans toucher au code.

---

## 7. Avancement du projet (par phases)

- [x] **Phase 1** — Mise en place technique & configuration
- [x] **Phase 2** — Espace d'administration du contenu (Sanity Studio)
- [x] **Phase 3** — Composants visuels de base (en-tête, pied de page…)
- [x] **Phase 4** — Pages principales (accueil, services, à propos, contact)
- [x] **Phase 5** — Réalisations, promotions, blog
- [x] **Phase 6** — Formulaires de devis et de rendez-vous
- [x] **Phase 7** — Référencement (SEO), performances, pages légales
- [x] **Phase 8** — Documentation complète & mise en ligne

**✅ Projet terminé** — toutes les phases sont livrées.

---

## 7 bis. Documentation

| Document | Pour qui | Contenu |
|---|---|---|
| **[GUIDE-CONTENU.md](./GUIDE-CONTENU.md)** | Non-développeur | Gérer le contenu via `/studio` : services, logo, promos, articles… |
| **[DEPLOIEMENT.md](./DEPLOIEMENT.md)** | Mise en ligne | Déployer sur Vercel + Sanity, étape par étape |
| **[CLAUDE.md](./CLAUDE.md)** | Développeur | Conventions techniques du projet |
| **`.env.example`** | Mise en ligne | Modèle des variables d'environnement |

---

## 8. Bon à savoir

- **Aucun contenu n'est « écrit en dur »** dans le site : tout passe par
  l'administration. Modifier un texte, une photo ou un numéro de téléphone
  ne nécessite jamais de toucher au code.
- Le site est **bilingue** : français (par défaut) et anglais.
- En cas de problème, notez le message d'erreur exact et la commande lancée :
  cela facilite grandement le dépannage.

---

*Projet développé avec Next.js, Sanity CMS et Tailwind CSS — hébergement Vercel.*
