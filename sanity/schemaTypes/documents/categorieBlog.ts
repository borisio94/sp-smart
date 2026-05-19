import { defineType, defineField } from "sanity";
import { TagsIcon } from "@sanity/icons";

/**
 * Catégorie d'articles de blog.
 */
export const categorieBlog = defineType({
  name: "categorieBlog",
  title: "Catégorie de blog",
  type: "document",
  icon: TagsIcon,
  fields: [
    defineField({
      name: "title",
      title: "Nom (FR / EN)",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title.fr", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description (FR / EN)",
      type: "localeText",
    }),
  ],
  preview: { select: { title: "title.fr" } },
});
