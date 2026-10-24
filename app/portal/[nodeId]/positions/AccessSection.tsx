"use client";

import React from "react";
import {
  deleteOrganizationsByIdAccessByBindingId,
  postOrganizationsByIdAccess,
  useGetOrganizationsByIdAccess,
  useGetOrganizationsByIdRoles,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { AccessManager } from "./AccessManager";
import { apiErrorMessage } from "./apiErrorMessage";

export function AccessSection({ nodeId }: Readonly<{ nodeId: string }>) {
  const alert = React.useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const {
    data: entries,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdAccess(nodeId);
  const { data: roles } = useGetOrganizationsByIdRoles(nodeId);

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
      roles={roles ?? []}
      canManage={can("iam.manage")}
      onGrant={(email, roleId) =>
        run(
          () => postOrganizationsByIdAccess(nodeId, { email, roleId }),
          "Acceso otorgado",
        )
      }
      onRevoke={(bindingId) =>
        run(
          () => deleteOrganizationsByIdAccessByBindingId(nodeId, bindingId),
          "Acceso quitado",
        )
      }
    />
  );
}
