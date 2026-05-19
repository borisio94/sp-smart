import { defineType, defineField } from "sanity";
import { UserIcon } from "@sanity/icons";

/**
 * Membre de l'équipe (page À propos, auteur d'articles).
 */
export const membreEquipe = defineType({
  name: "membreEquipe",
  title: "Membre de l'équipe",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Poste (FR / EN)",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Biographie courte (FR / EN)",
      type: "localeText",
    }),
    defineField({
      name: "order",
      title: "Ordre d'affichage",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: { select: { title: "name", subtitle: "role.fr", media: "photo" } },
});
