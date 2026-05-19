import { defineType, defineField } from "sanity";
import { CogIcon } from "@sanity/icons";

/**
 * Paramètres globaux du site (document unique / singleton).
 * Logo, identité, coordonnées, horaires, réseaux sociaux, WhatsApp, SEO global.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Paramètres du site",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "identite", title: "Identité", default: true },
    { name: "contact", title: "Coordonnées" },
    { name: "horaires", title: "Horaires" },
    { name: "reseaux", title: "Réseaux & WhatsApp" },
    { name: "seo", title: "SEO global" },
  ],
  fields: [
    defineField({
      name: "companyName",
      title: "Nom de l'entreprise",
      type: "string",
      group: "identite",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "identite",
      options: { hotspot: true },
    }),
    defineField({
      name: "logoDark",
      title: "Logo (version fond sombre)",
      type: "image",
      group: "identite",
      options: { hotspot: true },
    }),
    defineField({
      name: "slogan",
      title: "Slogan (FR / EN)",
      type: "localeString",
      group: "identite",
    }),
    defineField({
      name: "phones",
      title: "Téléphones",
      type: "array",
      of: [{ type: "string" }],
      group: "contact",
    }),
    defineField({
      name: "emails",
      title: "Emails",
      type: "array",
      of: [{ type: "string" }],
      group: "contact",
    }),
    defineField({
      name: "address",
      title: "Adresse",
      type: "text",
      rows: 3,
      group: "contact",
    }),
    defineField({
      name: "geo",
      title: "Coordonnées GPS (carte Google Maps)",
      type: "object",
      group: "contact",
      fields: [
        defineField({ name: "lat", title: "Latitude", type: "number" }),
        defineField({ name: "lng", title: "Longitude", type: "number" }),
      ],
    }),
    defineField({
      name: "openingHours",
      title: "Horaires d'ouverture",
      type: "array",
      of: [{ type: "openingHours" }],
      group: "horaires",
    }),
    defineField({
      name: "closedDays",
      title: "Jours fermés exceptionnels (rendez-vous)",
      type: "array",
      of: [{ type: "date" }],
      group: "horaires",
    }),
    defineField({
      name: "whatsappNumber",
      title: "Numéro WhatsApp (format international, ex : 2376XXXXXXXX)",
      type: "string",
      group: "reseaux",
    }),
    defineField({
      name: "whatsappMessage",
      title: "Message WhatsApp pré-rempli (FR / EN)",
      type: "localeString",
      group: "reseaux",
    }),
    defineField({
      name: "socials",
      title: "Réseaux sociaux",
      type: "array",
      group: "reseaux",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Plateforme",
              type: "string",
              options: {
                list: [
                  "Facebook",
                  "Instagram",
                  "LinkedIn",
                  "YouTube",
                  "TikTok",
                  "X (Twitter)",
                ],
              },
            }),
            defineField({ name: "url", title: "Lien", type: "url" }),
          ],
          preview: { select: { title: "platform", subtitle: "url" } },
        },
      ],
    }),
    defineField({
      name: "defaultSeo",
      title: "SEO par défaut (toutes pages)",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Paramètres du site" }),
  },
});
