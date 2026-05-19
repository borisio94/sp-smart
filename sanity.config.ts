/**
 * Configuration du Sanity Studio embarqué (route /studio).
 * Interface en français, structure personnalisée, schémas du projet.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { frFRLocale } from "@sanity/locale-fr-fr";

import { apiVersion, dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

// Documents singleton : un seul exemplaire, non supprimable / non dupliquable
const singletonTypes = new Set(["siteSettings", "homePage", "aboutPage"]);

// Documents en lecture seule (alimentés par les formulaires du site)
const readOnlyTypes = new Set(["demandeDevis", "rendezVous"]);

export default defineConfig({
  name: "default",
  title: "SP Smart Sarl",
  basePath: "/studio",

  projectId,
  dataset,

  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
    frFRLocale(),
  ],

  schema: {
    types: schemaTypes,
    // Le singleton n'apparaît pas dans le menu « Créer »
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Actions restreintes pour singletons et documents en lecture seule
    actions: (input, context) => {
      if (singletonTypes.has(context.schemaType)) {
        return input.filter(
          ({ action }) =>
            action && ["publish", "discardChanges", "restore"].includes(action),
        );
      }
      if (readOnlyTypes.has(context.schemaType)) {
        return input.filter(
          ({ action }) => action && ["discardChanges", "restore"].includes(action),
        );
      }
      return input;
    },
  },
});
