import { defineType, defineField, defineArrayMember } from "sanity";
import { HomeIcon } from "@sanity/icons";

/**
 * Page d'accueil (document unique / singleton).
 * Hero, chiffres clés, « pourquoi nous », titres de sections, CTA final.
 * (Les services, témoignages, articles, partenaires affichés sur l'accueil
 *  proviennent de leurs propres documents.)
 */
export const homePage = defineType({
  name: "homePage",
  title: "Page d'accueil",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "stats", title: "Chiffres clés" },
    { name: "why", title: "Pourquoi nous" },
    { name: "sections", title: "Titres de sections" },
    { name: "cta", title: "Appel à l'action" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // --- Hero ---
    defineField({
      name: "heroTitle",
      title: "Titre principal (FR / EN)",
      type: "localeString",
      group: "hero",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroSubtitle",
      title: "Sous-titre (FR / EN)",
      type: "localeText",
      group: "hero",
    }),
    defineField({
      name: "heroImage",
      title: "Image de fond (repli)",
      description:
        "Utilisée si le diaporama « Images de fond » ci-dessous est vide.",
      type: "image",
      group: "hero",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroImages",
      title: "Images de fond (diaporama)",
      description:
        "Plusieurs images qui défilent automatiquement en fondu. Laisser vide pour n'afficher qu'une seule image (« Image de fond » ci-dessus).",
      type: "array",
      group: "hero",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Texte alternatif", type: "string" }],
        }),
      ],
    }),
    defineField({
      name: "heroVideoUrl",
      title: "Vidéo de fond (URL, optionnel)",
      type: "url",
      group: "hero",
    }),
    defineField({
      name: "heroPrimaryCta",
      title: "Bouton principal",
      type: "ctaButton",
      group: "hero",
    }),
    defineField({
      name: "heroSecondaryCta",
      title: "Bouton secondaire",
      type: "ctaButton",
      group: "hero",
    }),
    // --- Chiffres clés ---
    defineField({
      name: "stats",
      title: "Chiffres clés",
      type: "array",
      group: "stats",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "value",
              title: "Valeur (ex : 150+, 12)",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "label",
              title: "Libellé (FR / EN)",
              type: "localeString",
            }),
          ],
          preview: { select: { title: "value", subtitle: "label.fr" } },
        },
      ],
    }),
    // --- Pourquoi nous ---
    defineField({
      name: "whyTitle",
      title: "Titre « Pourquoi nous » (FR / EN)",
      type: "localeString",
      group: "why",
    }),
    defineField({
      name: "whyItems",
      title: "Atouts",
      type: "array",
      group: "why",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "icon",
              title: "Icône (nom Lucide)",
              type: "string",
            }),
            defineField({
              name: "title",
              title: "Titre (FR / EN)",
              type: "localeString",
            }),
            defineField({
              name: "description",
              title: "Description (FR / EN)",
              type: "localeText",
            }),
          ],
          preview: { select: { title: "title.fr" } },
        },
      ],
    }),
    // --- Titres de sections ---
    defineField({
      name: "servicesTitle",
      title: "Titre section Services (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    defineField({
      name: "testimonialsTitle",
      title: "Titre section Témoignages (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    defineField({
      name: "blogTitle",
      title: "Titre section Blog (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    defineField({
      name: "partnersTitle",
      title: "Titre section Partenaires (FR / EN)",
      type: "localeString",
      group: "sections",
    }),
    // --- CTA final ---
    defineField({
      name: "ctaTitle",
      title: "Titre (FR / EN)",
      type: "localeString",
      group: "cta",
    }),
    defineField({
      name: "ctaText",
      title: "Texte (FR / EN)",
      type: "localeText",
      group: "cta",
    }),
    defineField({
      name: "ctaButton",
      title: "Bouton",
      type: "ctaButton",
      group: "cta",
    }),
    defineField({
      name: "seo",
      title: "Référencement",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: { prepare: () => ({ title: "Page d'accueil" }) },
});
