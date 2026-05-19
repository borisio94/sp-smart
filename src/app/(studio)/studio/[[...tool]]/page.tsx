/**
 * Route /studio — administration du contenu (Sanity Studio embarqué).
 * Cette page n'est pas indexée par les moteurs de recherche.
 */
import { Studio } from "./Studio";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <Studio />;
}
