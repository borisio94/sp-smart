"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Wand2 } from "lucide-react";

import type { DocumentInput } from "@/lib/billing/validation";
import {
  reportSkeleton,
  isReportEmpty,
  INTERVENTION_TYPE_LABELS,
} from "@/lib/billing/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReportStep = "intervention" | "travaux" | "conclusion";

const INTERVENTION_TYPES = Object.keys(
  INTERVENTION_TYPE_LABELS,
) as (keyof typeof INTERVENTION_TYPE_LABELS)[];

/**
 * Sections structurées d'un rapport de maintenance (consomment le contexte RHF
 * du formulaire parent). Une trame professionnelle guide la rédaction ; aucune
 * logique de montant n'intervient ici.
 */
export function ReportFields({ step }: { step: ReportStep }) {
  const t = useTranslations("Admin");
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<DocumentInput>();

  const equipments = useFieldArray({ control, name: "report.equipments" });
  const operations = useFieldArray({ control, name: "report.operations" });
  const parts = useFieldArray({ control, name: "report.parts" });

  const rErr = errors.report;
  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;
  const reqMark = (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );

  /** (Ré)insère la structure type professionnelle dans le rapport. */
  function applySkeleton() {
    if (
      !isReportEmpty(getValues("report")) &&
      !window.confirm(t("documents.report.applyConfirm"))
    ) {
      return;
    }
    setValue("report", reportSkeleton(), { shouldDirty: true });
  }

  if (step === "intervention") {
    return (
      <div className="space-y-4">
        <Button type="button" variant="outline" size="sm" onClick={applySkeleton}>
          <Wand2 className="size-4" />
          {t("documents.report.applySkeleton")}
        </Button>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="r-type">{t("documents.report.interventionType")}</Label>
            <Select id="r-type" className="mt-1" {...register("report.intervention_type")}>
              {INTERVENTION_TYPES.map((it) => (
                <option key={it} value={it}>
                  {INTERVENTION_TYPE_LABELS[it]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="r-date">
              {t("documents.report.interventionDate")}
              {reqMark}
            </Label>
            <Input
              id="r-date"
              className="mt-1"
              placeholder={t("documents.report.interventionDatePlaceholder")}
              aria-invalid={rErr?.intervention_date ? true : undefined}
              {...register("report.intervention_date")}
            />
            {err(rErr?.intervention_date?.message)}
          </div>
          <div>
            <Label htmlFor="r-site">
              {t("documents.report.site")}
              {reqMark}
            </Label>
            <Input
              id="r-site"
              className="mt-1"
              placeholder={t("documents.report.sitePlaceholder")}
              aria-invalid={rErr?.site ? true : undefined}
              {...register("report.site")}
            />
            {err(rErr?.site?.message)}
          </div>
          <div>
            <Label htmlFor="r-tech">
              {t("documents.report.technicians")}
              {reqMark}
            </Label>
            <Input
              id="r-tech"
              className="mt-1"
              placeholder={t("documents.report.techniciansPlaceholder")}
              aria-invalid={rErr?.technicians ? true : undefined}
              {...register("report.technicians")}
            />
            {err(rErr?.technicians?.message)}
          </div>
          <div>
            <Label htmlFor="r-start">{t("documents.report.startTime")}</Label>
            <Input id="r-start" type="time" className="mt-1" {...register("report.start_time")} />
          </div>
          <div>
            <Label htmlFor="r-end">{t("documents.report.endTime")}</Label>
            <Input id="r-end" type="time" className="mt-1" {...register("report.end_time")} />
          </div>
        </div>

        <div>
          <Label htmlFor="r-request">
            {t("documents.report.request")}
            {reqMark}
          </Label>
          <Textarea
            id="r-request"
            className="mt-1"
            placeholder={t("documents.report.requestPlaceholder")}
            aria-invalid={rErr?.request ? true : undefined}
            {...register("report.request")}
          />
          {err(rErr?.request?.message)}
        </div>

        {/* Équipements concernés */}
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("documents.report.equipments")}</p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("documents.report.eqDesignation")}</th>
                  <th className="px-3 py-2 font-medium">{t("documents.report.eqBrandModel")}</th>
                  <th className="px-3 py-2 font-medium">{t("documents.report.eqSerial")}</th>
                  <th className="px-3 py-2 font-medium">{t("documents.report.eqLocation")}</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {equipments.fields.map((field, i) => (
                  <tr key={field.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <Input {...register(`report.equipments.${i}.designation` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input {...register(`report.equipments.${i}.brand_model` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input {...register(`report.equipments.${i}.serial` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input {...register(`report.equipments.${i}.location` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => equipments.remove(i)}
                        aria-label={t("documents.report.removeRow")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {equipments.fields.length === 0 ? (
                  <tr className="border-t border-border">
                    <td colSpan={5} className="px-3 py-3 text-center text-muted-foreground">
                      {t("documents.report.emptyEquipments")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              equipments.append({ designation: "", brand_model: "", serial: "", location: "" })
            }
          >
            <Plus className="size-4" />
            {t("documents.report.addEquipment")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "travaux") {
    return (
      <div className="space-y-5">
        <div>
          <Label htmlFor="r-diag">{t("documents.report.diagnosis")}</Label>
          <Textarea
            id="r-diag"
            className="mt-1 min-h-32"
            placeholder={t("documents.report.diagnosisPlaceholder")}
            {...register("report.diagnosis")}
          />
        </div>

        {/* Travaux réalisés */}
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("documents.report.operations")}</p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("documents.report.opDescription")}</th>
                  <th className="w-36 px-3 py-2 font-medium">{t("documents.report.opStatus")}</th>
                  <th className="w-28 px-3 py-2 font-medium">{t("documents.report.opDuration")}</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {operations.fields.map((field, i) => (
                  <tr key={field.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <Input {...register(`report.operations.${i}.description` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        placeholder={t("documents.report.opStatusPlaceholder")}
                        {...register(`report.operations.${i}.status` as const)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        placeholder={t("documents.report.opDurationPlaceholder")}
                        {...register(`report.operations.${i}.duration` as const)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => operations.remove(i)}
                        aria-label={t("documents.report.removeRow")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {operations.fields.length === 0 ? (
                  <tr className="border-t border-border">
                    <td colSpan={4} className="px-3 py-3 text-center text-muted-foreground">
                      {t("documents.report.emptyOperations")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => operations.append({ description: "", status: "Réalisée", duration: "" })}
          >
            <Plus className="size-4" />
            {t("documents.report.addOperation")}
          </Button>
        </div>

        {/* Pièces & fournitures */}
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("documents.report.parts")}</p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("documents.report.partDesignation")}</th>
                  <th className="w-28 px-3 py-2 font-medium">{t("documents.report.partQuantity")}</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {parts.fields.map((field, i) => (
                  <tr key={field.id} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      <Input {...register(`report.parts.${i}.designation` as const)} />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        {...register(`report.parts.${i}.quantity` as const, { valueAsNumber: true })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => parts.remove(i)}
                        aria-label={t("documents.report.removeRow")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {parts.fields.length === 0 ? (
                  <tr className="border-t border-border">
                    <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground">
                      {t("documents.report.emptyParts")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => parts.append({ designation: "", quantity: 1 })}
          >
            <Plus className="size-4" />
            {t("documents.report.addPart")}
          </Button>
        </div>

        <div>
          <Label htmlFor="r-tests">{t("documents.report.tests")}</Label>
          <Textarea
            id="r-tests"
            className="mt-1 min-h-32"
            placeholder={t("documents.report.testsPlaceholder")}
            {...register("report.tests")}
          />
        </div>
      </div>
    );
  }

  // step === "conclusion"
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="r-obs">{t("documents.report.observations")}</Label>
        <Textarea
          id="r-obs"
          className="mt-1 min-h-32"
          placeholder={t("documents.report.observationsPlaceholder")}
          {...register("report.observations")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="r-conformity">{t("documents.report.conformity")}</Label>
          <Input
            id="r-conformity"
            className="mt-1"
            placeholder={t("documents.report.conformityPlaceholder")}
            {...register("report.conformity")}
          />
        </div>
        <div>
          <Label htmlFor="r-state">{t("documents.report.finalState")}</Label>
          <Input
            id="r-state"
            className="mt-1"
            placeholder={t("documents.report.finalStatePlaceholder")}
            {...register("report.final_state")}
          />
        </div>
        <div>
          <Label htmlFor="r-next">{t("documents.report.nextMaintenance")}</Label>
          <Input
            id="r-next"
            className="mt-1"
            placeholder={t("documents.report.nextMaintenancePlaceholder")}
            {...register("report.next_maintenance")}
          />
        </div>
      </div>
    </div>
  );
}
