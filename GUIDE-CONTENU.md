# Guide de gestion du contenu — SP Smart Sarl

Ce guide explique, **sans aucune compétence technique**, comment modifier le
contenu du site depuis l'espace d'administration.

> Tout le site (textes, images, services, promotions, articles, coordonnées…)
> se modifie ici. Vous ne touchez **jamais** au code.

---

## 1. Se connecter à l'administration

1. Ouvrez votre navigateur sur :
   - En local : **http://localhost:3000/studio**
   - En ligne : **https://VOTRE-SITE.vercel.app/studio** (après déploiement)
2. Connectez-vous avec le compte Sanity de l'entreprise
   (**spsmartsarl@gmail.com** via Google).
3. Vous arrivez sur le tableau de bord : un menu à gauche liste tous les
   contenus.

---

## 2. Comprendre le menu

| Élément | À quoi ça sert |
|---|---|
| **Page d'accueil** | Titre principal, sous-titre, chiffres clés, « pourquoi nous », appel à l'action |
| **Page À propos** | Histoire, mission, valeurs |
| **Pages légales** | Mentions légales, confidentialité, CGV |
| **Paramètres du site** | Logo, nom, slogan, téléphones, emails, adresse, horaires, WhatsApp, réseaux sociaux |
| **Services** | Vos prestations (une fiche par service) |
| **Réalisations** | Vos projets / portfolio |
| **Promotions** | Offres en cours |
| **Témoignages** | Avis clients |
| **Articles / Catégories** | Le blog |
| **Équipe / Partenaires / FAQ** | Pages secondaires |
| **Demandes de devis / Rendez-vous** | Reçues via les formulaires (lecture seule) |

> 🌐 **Bilingue** : chaque champ texte a une version **Français** et
> **Anglais**. Le français est obligatoire ; l'anglais est conseillé.

---

## 3. Règle d'or : Publier

Après **chaque** modification, cliquez sur le bouton **« Publish »**
(Publier) en bas à droite. Tant que ce n'est pas publié, le changement
n'apparaît pas sur le site.

---

## 4. Modifier le logo et les coordonnées

1. Menu → **Paramètres du site**
2. **Logo** : cliquez sur la zone image → *Upload* → choisissez votre fichier
   (PNG ou SVG conseillé, fond transparent)
3. Modifiez téléphones, emails, adresse, **numéro WhatsApp**
   (format international, ex. `237699000000`), horaires, réseaux sociaux
4. **Publish**

---

## 5. Ajouter un service

1. Menu → **Services** → bouton **« Create »** (Créer)
2. Remplissez :
   - **Titre** (FR + EN)
   - **Slug** : cliquez sur *Generate* (c'est l'adresse de la page)
   - **Icône** : un nom d'icône (ex. `shield`, `camera`, `zap`, `sun`,
     `door-open`) — voir la liste sur https://lucide.dev/icons
   - **Ordre d'affichage** : 1, 2, 3… (ordre dans le menu et la grille)
   - **Description courte** (FR + EN)
   - **Description détaillée**, **image principale**, **galerie**, **vidéo**
     (lien YouTube), **avantages**, **caractéristiques**, **FAQ**
3. **Publish**

➡️ Le service apparaît automatiquement dans le menu, la page Services et
le formulaire de devis.

---

## 6. Créer une promotion

1. Menu → **Promotions** → **Create**
2. Titre, description, image, type de remise (% ou montant), **code promo**
3. **Date de début** et **date de fin** (la promo disparaît automatiquement
   à la fin)
4. Cochez **« Active »**, et **« Afficher en bannière sur l'accueil »** si
   vous voulez le bandeau en haut du site
5. **Publish**

---

## 7. Publier un article de blog

1. (Optionnel) Menu → **Catégories de blog** → créez une catégorie
2. Menu → **Articles** → **Create**
3. Titre, slug (*Generate*), extrait, image de couverture, **contenu**
   (texte riche : titres, listes, liens, images)
4. Choisissez l'auteur (un membre de l'équipe), la catégorie, la
   **date de publication**
5. **Publish**

> Un article n'apparaît que si sa date de publication est passée.

---

## 8. Voir les demandes reçues

- Menu → **Demandes de devis** ou **Rendez-vous**
- Ces fiches sont créées automatiquement quand un visiteur remplit un
  formulaire. Vous pouvez seulement changer leur **statut**
  (nouveau → traité → converti).

> ℹ️ Les emails de notification ne fonctionnent qu'une fois la clé
> **Resend** configurée (voir `DEPLOIEMENT.md`).

---

## 9. Conseils images

- Formats : **JPG/PNG** pour les photos, **SVG/PNG** pour les logos
- Le site optimise et redimensionne automatiquement (WebP/AVIF)
- Utilisez le **point de recadrage** (hotspot) après upload pour bien cadrer

---

## 10. En cas de doute

- Une modification n'apparaît pas ? → Vérifiez que vous avez cliqué
  **Publish**, puis rafraîchissez la page (Ctrl+F5).
- Un texte s'affiche en anglais sur le site français ? → Le champ **FR**
  était vide ; remplissez-le.
- Besoin d'aide ? Notez précisément la page et l'action concernées.
