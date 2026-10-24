"use client";

import React from "react";
import {
  deleteOrganizationsByIdOwnersByBindingId,
  postOrganizationsByIdOwners,
  useGetOrganizationsById,
  useGetOrganizationsByIdAccess,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { AccessManager } from "./AccessManager";
import { apiErrorMessage } from "./apiErrorMessage";

export default function AccessPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const {
    data: entries,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdAccess(nodeId);
  const { data: node } = useGetOrganizationsById(nodeId);

  if (isLoading) return <Loading />;
  if (!entries) return <ResourceError error={error} />;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
    } catch (failure) {
      alert.showMessage(apiErrorMessage(failure, "No se pudo guardar."));
      return;
    }
    await mutate();
    alert.showMessage(message);
  };

  return (
    <AccessManager
      entries={entries}
      canManage={can("iam.manage")}
      isChurch={node?.type === "CHURCH"}
      positionsHref={`/portal/${nodeId}/positions`}
      onAddOwner={(email) =>
        run(
          () => postOrganizationsByIdOwners(nodeId, { email }),
          "Propietario agregado",
        )
      }
      onRemoveOwner={(bindingId) =>
        run(
          () => deleteOrganizationsByIdOwnersByBindingId(nodeId, bindingId),
          "Propietario quitado",
        )
      }
    />
  );
}
