"use client";

import { Alert, Button } from "@mui/material";
import NextLink from "next/link";
import { useGetOrganizationsByIdBilling } from "@/app/(api)/generated";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import {
  isNearLimit,
  nextPlan,
  planName,
  plural,
} from "@/app/(components)/billingFormat";

// A heads-up before the plan says no: the church is near the people maximum
// of its plan, or it has no number of its own for WhatsApp yet. Best effort:
// if the plan cannot be read it shows nothing (the API still refuses what the
// plan does not allow, and the screen of the plan shows the real state).
export const PlanUsageNotice = ({
  nodeId,
  kind,
}: Readonly<{ nodeId: string; kind: "people" | "ownNumber" }>) => {
  const { data: billing } = useGetOrganizationsByIdBilling(nodeId);
  const { can } = usePermissions(nodeId);
  if (!billing) return null;

  // Whoever pays gets the way there; the rest are told who to ask.
  const action = can("billing.manage") ? (
    <Button
      color="inherit"
      size="small"
      component={NextLink}
      href={`/portal/${nodeId}/billing`}
    >
      Ver planes
    </Button>
  ) : undefined;

  if (kind === "people") {
    if (!isNearLimit(billing.people, billing.maxPeople)) return null;
    const max = billing.maxPeople ?? 0;
    const plan = planName(billing.plan);
    const next = nextPlan(billing);
    const full = (billing.people ?? 0) >= max;
    return (
      <Alert severity={full ? "warning" : "info"} action={action}>
        {full
          ? `Tu iglesia llegó al máximo de ${plural(max, "persona", "personas")} del plan ${plan}: no podrás agregar más${next ? ` hasta pasar al plan ${planName(next.plan)}` : ""}.`
          : `Tu iglesia usa ${billing.people} de ${plural(max, "persona", "personas")} del plan ${plan}.`}
      </Alert>
    );
  }

  if (billing.ownNumber) return null;
  return (
    <Alert severity="info" action={action}>
      Tu iglesia usa el número de WhatsApp de Sr. Tommy. Conectar un número
      propio es parte del plan Red, o un extra de los planes Básico e Iglesia.
    </Alert>
  );
};
