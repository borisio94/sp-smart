import { defineType, defineField } from "sanity";

/**
 * Contenu riche bilingue (description longue d'un service, corps d'article).
 */
export const localeBlockContent = defineType({
  name: "localeBlockContent",
  title: "Contenu riche (FR / EN)",
  type: "object",
  fields: [
    defineField({
      name: "fr",
      title: "Français",
      type: "blockContent",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "en",
      title: "Anglais",
      type: "blockContent",
    }),
  ],
});
