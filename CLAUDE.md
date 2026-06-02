# CLAUDE.md — Conventions du projet SP Smart Sarl

Site web professionnel de **SP Smart Sarl** (sécurité & électricité, Cameroun).
Le cahier des charges complet fait foi : `../\_spsmart_backup/PROJECT_BRIEF.md`
(hors du dépôt). **Le relire avant toute phase.**

## Règle absolue : ZÉRO hard-coding

- Tout le contenu vient de **Sanity** : textes, images, vidéos, services,
  témoignages, promos, blog, contact, horaires, équipe, FAQ, hero, footer, nav.
- Aucun `<img src="/...">`, aucun numéro de téléphone, email ou adresse en dur
  dans le JSX.
- Couleurs et typo : variables CSS dans `src/app/globals.css` (tokens `brand`,
  `brand-light`, `brand-navy`, `primary`…). Jamais de couleur en dur dans un
  composant.
- Chaînes d'interface (boutons, labels) : fichiers de traduction
  `messages/fr.json` et `messages/en.json` via next-intl. Jamais de texte UI
  codé en dur.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4
(config CSS, **pas** de `tailwind.config.ts`) · shadcn/ui · Sanity CMS
(`/studio`) · next-intl (FR défaut / EN) · Framer Motion · React Hook Form +
Zod · Resend · next-sitemap. Hébergement Vercel.

## Conventions code

- **TypeScript strict** : pas de `any`, pas de `// @ts-ignore`.
- **Commentaires en français.**
- **Server Components par défaut** ; `"use client"` uniquement si nécessaire.
- Pas de logique métier dans les composants (extraire en `lib/` / actions).
- Composants atomiques et réutilisables.
- Polices : Inter via `next/font` (variable `--font-sans`).
- Tests E2E non requis pour l'instant.

## Méthode : travail par PHASES

Procéder phase par phase. **STOP et demander la validation de l'utilisateur
avant de passer à la phase suivante.** Ne générer aucun code sans validation.

1. ✅ **Phase 1** — Scaffold & config *(terminée)*
2. ✅ **Phase 2** — Sanity Studio `/studio` + schémas (FR/EN) *(terminée)*
3. ✅ **Phase 3** — Composants UI de base & layout + i18n next-intl *(terminée)*
4. ✅ **Phase 4** — Pages publiques (home, services, à propos, contact) *(terminée)*
5. ✅ **Phase 5** — Réalisations, promotions, blog *(terminée)*
6. ✅ **Phase 6** — Formulaires devis + rendez-vous + contact *(terminée)*
7. ✅ **Phase 7** — SEO, performances, pages légales *(terminée)*
8. ✅ **Phase 8** — Documentation & déploiement *(terminée)*

**🎉 PROJET TERMINÉ — les 8 phases sont livrées.**

Schémas Sanity : `siteSettings`, `service`, `realisation`, `temoignage`,
`promotion`, `article`, `categorieBlog`, `membreEquipe`, `partenaire`,
`faq`, `demandeDevis`, `rendezVous` (Phase 2) + singletons `homePage` et
`aboutPage` (ajoutés en Phase 4 pour le contenu éditorial des pages, requis
par la règle zéro hard-coding — hors des 12 schémas initiaux du brief).

## Points techniques à respecter (acquis Phase 3)

- **shadcn = Base UI** (style `base-nova`), PAS Radix. Composer avec la prop
  `render={<Comp/>}`, jamais `asChild`. Pas de `@radix-ui/*`.
- **Bouton-lien** : ne JAMAIS faire `<Button render={<Link/>}>` (Base UI
  exige `nativeButton={false}` si le rendu n'est pas un `<button>`).
  Utiliser le composant **`ButtonLink`** (`@/components/ui/button-link`)
  pour tout bouton qui navigue.
- **Routage i18n** : `src/app/(frontend)/[locale]/` (localisé) +
  `src/app/(studio)/` (non localisé). Pas de `app/layout.tsx` racine
  (multiple root layouts). Navigation via `@/i18n/navigation` (`Link`…),
  jamais `next/link`. Langues : FR défaut, EN, préfixe toujours présent.
- **Proxy** : `src/proxy.ts` (ex-middleware, renommé pour Next 16).
- **Données Sanity** : toujours via `sanityFetch(query, params, fallback)`
  (tolérant aux pannes). Client/image utilisent un projectId factice tant
  que `.env.local` = `A_REMPLIR` → le site tourne sans clés (contenu vide).
- **Icônes** : `lucide-react` n'a plus d'icônes de marque (Facebook…).
  Composant `DynamicIcon` pour les icônes de service (nom Sanity).
- Chemins vers `sanity/` : imports relatifs (hors de `src/`, alias `@/`
  ne couvre que `src/`).

## Sécurité

- Secrets dans `.env.local` (jamais commité) ; `.env.example` versionné.
- Rate limiting + hCaptcha sur les formulaires.
- Headers de sécurité Next.js (CSP, HSTS, X-Frame-Options).
- Secret de webhook Sanity pour la revalidation.

## Structure

```
src/
  app/            Routes (App Router) — Server Components par défaut
  components/ui/  shadcn/ui
  lib/            Utilitaires, clients (Sanity…), logique métier
sanity/           Config Studio & schémas (Phase 2)
messages/         fr.json / en.json (Phase 2-3)
```

## Langue d'échange

Répondre à l'utilisateur **en français**.
