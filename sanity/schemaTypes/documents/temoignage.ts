import { defineType, defineField } from "sanity";
import { CommentIcon } from "@sanity/icons";

/**
 * Témoignage / avis client.
 */
export const temoignage = defineType({
  name: "temoignage",
  title: "Témoignage",
  type: "document",
  icon: CommentIcon,
  fields: [
    defineField({
      name: "name",
      title: "Nom du client",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Fonction / Entreprise (FR / EN)",
      type: "localeString",
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "text",
      title: "Témoignage (FR / EN)",
      type: "localeText",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Note (1 à 5)",
      type: "number",
      validation: (rule) => rule.min(1).max(5).integer(),
      initialValue: 5,
    }),
    defineField({
      name: "service",
      title: "Service concerné",
      type: "reference",
      to: [{ type: "service" }],
    }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({
      name: "verified",
      title: "Vérifié",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role.fr", media: "photo" },
  },
});
