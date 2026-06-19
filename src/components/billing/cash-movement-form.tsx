"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import {
  expenseSchema,
  cashEntrySchema,
  type ExpenseInput,
  type CashEntryInput,
} from "@/lib/billing/validation";
import {
  formatMoney,
  PAYMENT_METHOD_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/billing/format";
import type { PaymentMethod } from "@/lib/billing/types";
import {
  createExpense,
  createEntry,
} from "@/app/(admin)/admin/billing/(protected)/caisse/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  expenseCategories: { id: string; name: string }[];
  documents: { id: string; number: string | null; type: string }[];
  defaultDate: string;
}

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/** Formulaire d'opération de caisse : bascule Dépense / Entrée. */
export function CashMovementForm(props: Props) {
  const t = useTranslations("Admin");
  const [mode, setMode] = useState<"out" | "in">("out");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Bascule de sens */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("out")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
            mode === "out"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <ArrowDownCircle className="size-4" />
          {t("caisse.expense")}
        </button>
        <button
          type="button"
          onClick={() => setMode("in")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
            mode === "in"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <ArrowUpCircle className="size-4" />
          {t("caisse.entry")}
        </button>
      </div>

      {mode === "out" ? (
        <ExpenseForm categories={props.expenseCategories} defaultDate={props.defaultDate} />
      ) : (
        <EntryForm documents={props.documents} defaultDate={props.defaultDate} />
      )}
    </div>
  );
}

/** Champ « moyen de paiement » optionnel, réutilisé par les deux formulaires. */
function MethodSelect({
  id,
  register,
}: {
  id: string;
  register: UseFormRegisterReturn;
}) {
  const t = useTranslations("Admin");
  return (
    <div>
      <Label htmlFor={id}>{t("caisse.method")}</Label>
      <Select id={id} className="mt-1" {...register}>
        <option value="">{t("caisse.methodNone")}</option>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {PAYMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </Select>
    </div>
  );
}

/* ───────────────────────── Dépense ───────────────────────── */

function ExpenseForm({
  categories,
  defaultDate,
}: {
  categories: { id: string; name: string }[];
  defaultDate: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      occurred_at: defaultDate,
      description: "",
      category_id: "",
      method: "",
      reference: "",
    },
    mode: "onTouched",
  });

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;
  const reqMark = (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );

  function onSubmit(values: ExpenseInput) {
    startTransition(async () => {
      let res = await createExpense({ ...values, confirmed: false });
      // Ligne rouge franchie → avertissement + confirmation explicite.
      if (!res.ok && res.needsConfirm) {
        const confirmed = window.confirm(
          t("caisse.redLineWarn", {
            projected: formatMoney(res.projected ?? 0),
            redLine: formatMoney(res.redLine ?? 0),
          }),
        );
        if (!confirmed) return;
        res = await createExpense({ ...values, confirmed: true });
      }
      if (res.ok) {
        toast.success(t("caisse.expenseSaved"));
        router.push("/admin/billing/caisse");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-amount">
            {t("caisse.amount")}
            {reqMark}
          </Label>
          <Input
            id="e-amount"
            type="number"
            min="0"
            className="mt-1"
            aria-invalid={errors.amount ? true : undefined}
            {...register("amount", { valueAsNumber: true })}
          />
          {err(errors.amount?.message)}
        </div>
        <div>
          <Label htmlFor="e-date">
            {t("caisse.date")}
            {reqMark}
          </Label>
          <Input
            id="e-date"
            type="date"
            className="mt-1"
            aria-invalid={errors.occurred_at ? true : undefined}
            {...register("occurred_at")}
          />
          {err(errors.occurred_at?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="e-desc">
          {t("caisse.description")}
          {reqMark}
        </Label>
        <Textarea
          id="e-desc"
          className="mt-1"
          placeholder={t("caisse.expenseDescPlaceholder")}
          aria-invalid={errors.description ? true : undefined}
          {...register("description")}
        />
        {err(errors.description?.message)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="e-cat">{t("caisse.category")}</Label>
          <Select id="e-cat" className="mt-1" {...register("category_id")}>
            <option value="">{t("caisse.noCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {categories.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">{t("caisse.noCategoryHint")}</p>
          ) : null}
        </div>
        <MethodSelect id="e-method" register={register("method")} />
      </div>

      <div>
        <Label htmlFor="e-ref">{t("caisse.reference")}</Label>
        <Input id="e-ref" className="mt-1" {...register("reference")} />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("caisse.saveExpense")}
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────── Entrée ───────────────────────── */

function EntryForm({
  documents,
  defaultDate,
}: {
  documents: { id: string; number: string | null; type: string }[];
  defaultDate: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashEntryInput>({
    resolver: zodResolver(cashEntrySchema),
    defaultValues: {
      amount: 0,
      occurred_at: defaultDate,
      document_id: "",
      description: "",
      method: "",
      reference: "",
    },
    mode: "onTouched",
  });

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;
  const reqMark = (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );

  function onSubmit(values: CashEntryInput) {
    startTransition(async () => {
      const res = await createEntry(values);
      if (res.ok) {
        toast.success(t("caisse.entrySaved"));
        router.push("/admin/billing/caisse");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function docLabel(d: { number: string | null; type: string }) {
    const label = DOCUMENT_TYPE_LABELS[d.type as keyof typeof DOCUMENT_TYPE_LABELS];
    return d.number ?? label ?? "—";
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="i-amount">
            {t("caisse.amount")}
            {reqMark}
          </Label>
          <Input
            id="i-amount"
            type="number"
            min="0"
            className="mt-1"
            aria-invalid={errors.amount ? true : undefined}
            {...register("amount", { valueAsNumber: true })}
          />
          {err(errors.amount?.message)}
        </div>
        <div>
          <Label htmlFor="i-date">
            {t("caisse.date")}
            {reqMark}
          </Label>
          <Input
            id="i-date"
            type="date"
            className="mt-1"
            aria-invalid={errors.occurred_at ? true : undefined}
            {...register("occurred_at")}
          />
          {err(errors.occurred_at?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="i-doc">{t("caisse.linkedDocument")}</Label>
        <Select id="i-doc" className="mt-1" {...register("document_id")}>
          <option value="">{t("caisse.noDocument")}</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {docLabel(d)}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">{t("caisse.entryRuleHint")}</p>
      </div>

      <div>
        <Label htmlFor="i-desc">{t("caisse.description")}</Label>
        <Textarea
          id="i-desc"
          className="mt-1"
          placeholder={t("caisse.entryDescPlaceholder")}
          aria-invalid={errors.description ? true : undefined}
          {...register("description")}
        />
        {err(errors.description?.message)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MethodSelect id="i-method" register={register("method")} />
        <div>
          <Label htmlFor="i-ref">{t("caisse.reference")}</Label>
          <Input id="i-ref" className="mt-1" {...register("reference")} />
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("caisse.saveEntry")}
        </Button>
      </div>
    </form>
  );
}
