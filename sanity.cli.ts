/**
 * Configuration de la ligne de commande Sanity (`npx sanity ...`).
 */
import { defineCliConfig } from "sanity/cli";

import { dataset, projectId } from "./sanity/env";

export default defineCliConfig({
  api: { projectId, dataset },
  /** Routage côté client géré par Next.js (Studio embarqué). */
  studioHost: "spsmart",
  autoUpdates: true,
});
