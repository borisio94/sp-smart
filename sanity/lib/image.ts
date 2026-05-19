import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

import { dataset, projectId } from "../env";

// projectId factice valide tant que Sanity n'est pas configuré (cf. client.ts)
const safeProjectId = /^[a-z0-9-]+$/.test(projectId)
  ? projectId
  : "placeholder";

const builder = createImageUrlBuilder({ projectId: safeProjectId, dataset });

/**
 * Génère l'URL optimisée d'une image Sanity.
 * Exemple : urlForImage(image).width(800).format("webp").url()
 */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}
