"use client";

import { Alert, Stack, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import React from "react";
import {
  postOrganizationsByIdBillingSync,
  useGetOrganizationsByIdBilling,
  useGetOrganizationsByIdBillingInvoices,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { planName } from "@/app/(components)/billingFormat";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { InvoiceHistory } from "./InvoiceHistory";
import { PlanCheckout } from "./PlanCheckout";
import { PlanSummary } from "./PlanSummary";

// «Plan y pagos»: what the church has and uses (anyone who sees the church),
// and paying and the payments (whoever holds `billing.manage`).
export default function BillingPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const canManage = can("billing.manage");
  // The checkout sends the pastor back here with ?pago=completado.
  const returned = useSearchParams().get("pago") === "completado";

  const {
    data: billing,
    error,
    isLoading,
    mutate: refreshBilling,
  } = useGetOrganizationsByIdBilling(nodeId);
  const { data: invoices, mutate: refreshInvoices } =
    useGetOrganizationsByIdBillingInvoices(nodeId, {
      swr: { enabled: canManage },
    });

  // Coming back from the checkout: ask the provider about the pending payments
  // once (its own notice may not have arrived yet), then show the new plan.
  const checked = React.useRef(false);
  React.useEffect(() => {
    if (!returned || !canManage || checked.current) return;
    checked.current = true;
    postOrganizationsByIdBillingSync(nodeId)
      .then(async (plan) => {
        await refreshBilling(plan, { revalidate: false });
        await refreshInvoices();
        alert.showMessage(
          plan.status === "ACTIVE"
            ? `¡Listo! El plan ${planName(plan.plan)} está activo.`
            : "Estamos esperando la confirmación del pago. Vuelve en unos minutos.",
        );
      })
      .catch((failure: unknown) =>
        alert.showMessage(
          apiErrorMessage(failure, "No pudimos confirmar el pago ahora."),
        ),
      );
  }, [returned, canManage, nodeId, refreshBilling, refreshInvoices, alert]);

  if (isLoading) return <Loading />;
  if (!billing) return <ResourceError error={error} />;

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography component="h1" variant="h5">
        Plan y pagos
      </Typography>
      <PlanSummary billing={billing} />
      {canManage ? (
        <>
          <PlanCheckout nodeId={nodeId} billing={billing} />
          <InvoiceHistory invoices={invoices ?? []} />
        </>
      ) : (
        <Alert severity="info">
          Solo quien administra la iglesia puede pagar el plan o ver los pagos.
        </Alert>
      )}
    </Stack>
  );
}
