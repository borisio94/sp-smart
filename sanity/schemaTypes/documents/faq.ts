import { defineType, defineField } from "sanity";
import { HelpCircleIcon } from "@sanity/icons";

/**
 * Question / réponse fréquente (FAQ globale ou rattachée à un service).
 */
export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: "question",
      title: "Question (FR / EN)",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Réponse (FR / EN)",
      type: "localeText",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: [
          { title: "Général", value: "general" },
          { title: "Devis & tarifs", value: "devis" },
          { title: "Installation", value: "installation" },
          { title: "Maintenance", value: "maintenance" },
        ],
      },
      initialValue: "general",
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
  preview: { select: { title: "question.fr", subtitle: "category" } },
});
