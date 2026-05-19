import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

/**
 * Article de blog.
 */
export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "contenu", title: "Contenu", default: true },
    { name: "classement", title: "Classement" },
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
      name: "excerpt",
      title: "Extrait (FR / EN)",
      type: "localeText",
      group: "contenu",
    }),
    defineField({
      name: "coverImage",
      title: "Image de couverture",
      type: "image",
      group: "contenu",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Contenu (FR / EN)",
      type: "localeBlockContent",
      group: "contenu",
    }),
    defineField({
      name: "author",
      title: "Auteur",
      type: "reference",
      to: [{ type: "membreEquipe" }],
      group: "classement",
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "reference",
      to: [{ type: "categorieBlog" }],
      group: "classement",
    }),
    defineField({
      name: "relatedServices",
      title: "Services liés",
      type: "array",
      of: [{ type: "reference", to: [{ type: "service" }] }],
      group: "classement",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "classement",
    }),
    defineField({
      name: "publishedAt",
      title: "Date de publication",
      type: "datetime",
      group: "classement",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "seo", title: "Référencement", type: "seo", group: "seo" }),
  ],
  orderings: [
    {
      title: "Date de publication (récent → ancien)",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title.fr", media: "coverImage", subtitle: "publishedAt" },
  },
});
