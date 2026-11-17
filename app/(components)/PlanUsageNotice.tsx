"use client";

import { Alert, Button } from "@mui/material";
import NextLink from "next/link";
import { useGetOrganizationsByIdBilling } from "@/app/(api)/generated";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import {
  isNearLimit,
  plural,
  whatsappTrial,
} from "@/app/(components)/billingFormat";

// A heads-up before the plan says no: the free plan is near its people
// maximum, or its WhatsApp trial is running out. Best effort: if the plan
// cannot be read it shows nothing (the API still refuses what the plan does
// not allow, and the screen of the plan shows the real state).
export const PlanUsageNotice = ({
  nodeId,
  kind,
  now = new Date(),
}: Readonly<{ nodeId: string; kind: "people" | "whatsapp"; now?: Date }>) => {
  const { data: billing } = useGetOrganizationsByIdBilling(nodeId);
  const { can } = usePermissions(nodeId);
  if (!billing || billing.plan === "CHURCH") return null;

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
    const full = (billing.people ?? 0) >= (billing.maxPeople ?? Infinity);
    return (
      <Alert severity={full ? "warning" : "info"} action={action}>
        {full
          ? `Tu iglesia llegó al máximo de ${plural(billing.maxPeople ?? 0, "persona", "personas")} del plan Gratis: no podrás agregar más hasta pasar al plan Iglesia.`
          : `Tu iglesia usa ${billing.people} de ${plural(billing.maxPeople ?? 0, "persona", "personas")} del plan Gratis.`}
      </Alert>
    );
  }

  const trial = whatsappTrial(billing, now);
  if (!trial) return null;
  return (
    <Alert severity={trial.over ? "warning" : "info"} action={action}>
      {trial.over
        ? "Terminó la prueba gratuita de WhatsApp. Pasa al plan Iglesia para seguir usándolo."
        : `Te quedan ${plural(trial.daysLeft, "día", "días")} de prueba gratuita de WhatsApp.`}
    </Alert>
  );
};
