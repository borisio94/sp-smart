import { defineType, defineField, defineArrayMember } from "sanity";
import { ImagesIcon } from "@sanity/icons";

/**
 * Réalisation / projet livré (portfolio), avec images avant / après.
 */
export const realisation = defineType({
  name: "realisation",
  title: "Réalisation",
  type: "document",
  icon: ImagesIcon,
  fields: [
    defineField({
      name: "title",
      title: "Titre (FR / EN)",
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
      name: "service",
      title: "Service concerné",
      type: "reference",
      to: [{ type: "service" }],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "client", title: "Client (optionnel)", type: "string" }),
    defineField({ name: "location", title: "Lieu (ville)", type: "string" }),
    defineField({ name: "date", title: "Date du projet", type: "date" }),
    defineField({
      name: "description",
      title: "Description (FR / EN)",
      type: "localeText",
    }),
    defineField({
      name: "beforeImages",
      title: "Images « avant »",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
    }),
    defineField({
      name: "afterImages",
      title: "Images « après »",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true } })],
    }),
    defineField({
      name: "videoUrl",
      title: "Vidéo (URL YouTube, optionnel)",
      type: "url",
    }),
    defineField({
      name: "featured",
      title: "Mettre en avant",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Date (récent → ancien)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title.fr", media: "afterImages.0", subtitle: "location" },
  },
});
