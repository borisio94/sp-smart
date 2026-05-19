import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * État de chargement (squelette) affiché pendant la navigation.
 */
export default function Loading() {
  return (
    <Container className="py-20">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="mt-4 h-5 w-1/2 max-w-sm" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </Container>
  );
}
