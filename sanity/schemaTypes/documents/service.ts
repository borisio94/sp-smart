import { defineType, defineField, defineArrayMember } from "sanity";
import { WrenchIcon } from "@sanity/icons";

/**
 * Service proposé par SP Smart (ex : automatisation de portails,
 * vidéosurveillance…). Chaque service a sa page dédiée.
 */
export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  icon: WrenchIcon,
  groups: [
    { name: "contenu", title: "Contenu", default: true },
    { name: "media", title: "Médias" },
    { name: "details", title: "Détails techniques" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Titre (FR / EN)",
      type: "localeString",
      group: "contenu",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      group: "contenu",
      options: { source: "title.fr", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "icon",
      title: "Icône (nom Lucide, ex : shield, camera, zap)",
      type: "string",
      group: "contenu",
    }),
    defineField({
      name: "order",
      title: "Ordre d'affichage",
      type: "number",
      group: "contenu",
      initialValue: 0,
    }),
    defineField({
      name: "shortDescription",
      title: "Description courte (FR / EN)",
      type: "localeText",
      group: "contenu",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "longDescription",
      title: "Description détaillée (FR / EN)",
      type: "localeBlockContent",
      group: "contenu",
    }),
    defineField({
      name: "heroImage",
      title: "Image principale",
      type: "image",
      group: "media",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Galerie d'images",
      type: "array",
      group: "media",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", title: "Texte alternatif", type: "string" },
          ],
        }),
      ],
    }),
    defineField({
      name: "videoUrl",
      title: "Vidéo (URL YouTube, optionnel)",
      type: "url",
      group: "media",
    }),
    defineField({
      name: "features",
      title: "Caractéristiques techniques (FR / EN)",
      type: "array",
      group: "details",
      of: [{ type: "localeString" }],
    }),
    defineField({
      name: "advantages",
      title: "Avantages (FR / EN)",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          name: "advantageItem",
          type: "object",
          title: "Avantage",
          fields: [
            defineField({
              name: "title",
              title: "Titre (FR / EN)",
              type: "localeString",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description (FR / EN)",
              type: "localeText",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "icon",
              title: "Icône (nom Lucide, optionnel — ex : shield, zap)",
              type: "string",
            }),
          ],
          preview: {
            select: { title: "title.fr", subtitle: "description.fr" },
            prepare({ title, subtitle }) {
              return { title: title ?? "(sans titre)", subtitle };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "faq",
      title: "FAQ spécifique au service",
      type: "array",
      group: "details",
      of: [{ type: "reference", to: [{ type: "faq" }] }],
    }),
    defineField({
      name: "seo",
      title: "Référencement",
      type: "seo",
      group: "seo",
    }),
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title.fr", media: "heroImage", order: "order" },
    prepare({ title, media, order }) {
      return { title: title ?? "(sans titre)", subtitle: `Ordre : ${order ?? 0}`, media };
    },
  },
});
