import { getTranslations } from "next-intl/server";

import { listPayments } from "@/lib/billing/queries";
import { sumPayments, remainingAmount } from "@/lib/billing/payments";
import { formatMoney } from "@/lib/billing/format";
import { PaymentRecorder } from "./payment-recorder";
import { PaymentRow } from "./payment-row";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Section paiements d'une facture (Server Component) : barre de progression,
 * formulaire d'enregistrement et historique des paiements.
 */
export async function PaymentSection({
  documentId,
  totalAmount,
}: {
  documentId: string;
  totalAmount: number;
}) {
  const t = await getTranslations("Admin");
  const payments = await listPayments(documentId);
  const paid = sumPayments(payments);
  const remaining = remainingAmount(payments, totalAmount);
  const pct = totalAmount > 0 ? Math.min(100, Math.round((paid / totalAmount) * 100)) : 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("payments.sectionTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progression payé / total */}
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("payments.paid")} : <span className="tabular-nums text-foreground">{formatMoney(paid)}</span>
            </span>
            <span className="text-muted-foreground">
              {t("payments.remaining")} : <span className="tabular-nums text-foreground">{formatMoney(remaining)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Historique */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            {t("payments.history")}
          </p>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("payments.none")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </ul>
          )}
        </div>

        {/* Enregistrement */}
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
            {t("payments.add")}
          </p>
          <PaymentRecorder
            documentId={documentId}
            defaultDate={today}
            suggestedAmount={remaining}
          />
        </div>
      </CardContent>
    </Card>
  );
}
