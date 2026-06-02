"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

import {
  uploadBrandingAsset,
  removeBrandingAsset,
} from "@/app/(admin)/admin/billing/(protected)/parametres/signature/actions";
import { Button } from "@/components/ui/button";

type AssetKind = "logo" | "signature" | "stamp";

/**
 * Bloc d'upload d'une image de marque (logo, signature ou cachet).
 * Affiche un aperçu si l'asset existe déjà (via URL signée fournie par le serveur).
 */
export function BrandingUploader({
  kind,
  title,
  hint,
  previewUrl,
}: {
  kind: AssetKind;
  title: string;
  hint: string;
  previewUrl: string | null;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadBrandingAsset(kind, formData);
      if (res.ok) {
        toast.success(t("signature.uploaded"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onRemove() {
    startTransition(async () => {
      const res = await removeBrandingAsset(kind);
      if (res.ok) {
        toast.success(t("signature.removed"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="rounded-xl ring-1 ring-foreground/10 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>

      <div className="mt-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
        {previewUrl ? (
          // Aperçu : image stockée (URL signée). <img> natif car hors next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={title} className="max-h-24 max-w-[80%] object-contain" />
        ) : (
          <span className="text-sm text-muted-foreground">{t("signature.none")}</span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={onFileChange}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          <Upload className="size-4" />
          {previewUrl ? t("signature.replace") : t("signature.upload")}
        </Button>
        {previewUrl ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={pending}>
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
