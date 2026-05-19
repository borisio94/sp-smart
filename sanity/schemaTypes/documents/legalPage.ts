import { defineType, defineField } from "sanity";
import { DocumentIcon } from "@sanity/icons";

/**
 * Page légale (mentions légales, confidentialité, CGV).
 * Un document par type ; contenu rédigé librement dans l'administration.
 */
export const legalPage = defineType({
  name: "legalPage",
  title: "Page légale",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({
      name: "type",
      title: "Type de page",
      type: "string",
      options: {
        list: [
          { title: "Mentions légales", value: "mentions-legales" },
          {
            title: "Politique de confidentialité",
            value: "politique-confidentialite",
          },
          { title: "Conditions générales (CGV)", value: "cgv" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Titre (FR / EN)",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "content",
      title: "Contenu (FR / EN)",
      type: "localeBlockContent",
    }),
    defineField({
      name: "updatedAt",
      title: "Dernière mise à jour",
      type: "date",
    }),
  ],
  preview: {
    select: { title: "title.fr", subtitle: "type" },
  },
});
