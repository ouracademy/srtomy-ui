"use client";

import React from "react";
import {
  deletePositionsById,
  postOrganizationsByIdPositions,
  putPositionsById,
  useGetMeOrganizations,
  useGetOrganizationsByIdPositions,
  useGetPositionsSuggestions,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { churchOf, withIds } from "../../organizationTree";
import { PositionsManager } from "./PositionsManager";

// Positions belong to the church, so every node of a church shows the same list.
export default function PositionsPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { data: nodes } = useGetMeOrganizations();
  const church = churchOf(withIds(nodes), nodeId);
  const { can } = usePermissions(church?.id);
  const {
    data: positions,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdPositions(nodeId);
  const { data: suggestions } = useGetPositionsSuggestions();

  if (isLoading) return <Loading />;
  if (!positions) return <ResourceError error={error} />;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
    } catch {
      alert.showMessage(
        "No se pudo guardar. ¿Ya existe un cargo con ese nombre?",
      );
      return;
    }
    await mutate();
    alert.showMessage(message);
  };

  return (
    <PositionsManager
      positions={positions}
      suggestions={suggestions ?? []}
      canManage={can("positions.manage")}
      onCreate={(name) =>
        run(
          () => postOrganizationsByIdPositions(nodeId, { name }),
          "Cargo agregado",
        )
      }
      onRename={(id, name) =>
        run(() => putPositionsById(id, { name }), "Cargo renombrado")
      }
      onDelete={(id) => run(() => deletePositionsById(id), "Cargo eliminado")}
    />
  );
}
