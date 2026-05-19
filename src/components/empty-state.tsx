import { Inbox } from "lucide-react";

/**
 * Affiché lorsqu'aucune donnée Sanity n'est disponible
 * (projet non configuré ou section vide). Évite une page « cassée ».
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-6 py-16 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
