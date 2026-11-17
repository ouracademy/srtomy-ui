"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import { setPlanLimitHandler } from "../(api)/client";
import { SnackbarContext } from "../(components)/SnackbarContext";

// Explains a refusal of the plan (402) wherever it happens: the API's own text
// and, inside a node, a button to the plan screen. Renders nothing; it only
// registers itself while the portal is on screen.
export const PlanLimitNotice = () => {
  const alert = React.useContext(SnackbarContext);
  const router = useRouter();
  const nodeId = useParams<{ nodeId?: string }>().nodeId;

  React.useEffect(() => {
    setPlanLimitHandler(({ message }) =>
      alert.showMessage(
        message,
        nodeId
          ? {
              label: "Ver planes",
              onClick: () => router.push(`/portal/${nodeId}/billing`),
            }
          : undefined,
      ),
    );
    return () => setPlanLimitHandler(undefined);
  }, [alert, nodeId, router]);

  return null;
};
