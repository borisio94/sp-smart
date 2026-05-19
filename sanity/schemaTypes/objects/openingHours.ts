import { defineType, defineField } from "sanity";

const JOURS = [
  { title: "Lundi", value: "lundi" },
  { title: "Mardi", value: "mardi" },
  { title: "Mercredi", value: "mercredi" },
  { title: "Jeudi", value: "jeudi" },
  { title: "Vendredi", value: "vendredi" },
  { title: "Samedi", value: "samedi" },
  { title: "Dimanche", value: "dimanche" },
];

/**
 * Plage horaire d'ouverture pour un jour donné.
 * Sert aussi à calculer les créneaux de prise de rendez-vous.
 */
export const openingHours = defineType({
  name: "openingHours",
  title: "Horaire",
  type: "object",
  fields: [
    defineField({
      name: "day",
      title: "Jour",
      type: "string",
      options: { list: JOURS, layout: "dropdown" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "closed",
      title: "Fermé ce jour",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "open",
      title: "Ouverture (ex : 08:00)",
      type: "string",
      hidden: ({ parent }) => Boolean(parent?.closed),
    }),
    defineField({
      name: "close",
      title: "Fermeture (ex : 17:00)",
      type: "string",
      hidden: ({ parent }) => Boolean(parent?.closed),
    }),
  ],
  preview: {
    select: { day: "day", closed: "closed", open: "open", close: "close" },
    prepare({ day, closed, open, close }) {
      return {
        title: day ?? "—",
        subtitle: closed ? "Fermé" : `${open ?? "?"} – ${close ?? "?"}`,
      };
    },
  },
});
