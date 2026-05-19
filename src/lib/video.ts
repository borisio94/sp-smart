/**
 * Extrait l'identifiant d'une vidéo YouTube depuis différentes formes d'URL.
 * Renvoie l'URL d'intégration (embed) ou null si non reconnue.
 */
export function youtubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
