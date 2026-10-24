"use client";

import React from "react";
import {
  deleteRolesByRoleId,
  postOrganizationsByIdRoles,
  putRolesByRoleId,
  useGetIamPermissions,
  useGetMeOrganizations,
  useGetOrganizationsByIdRoles,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { churchOf, withIds } from "../../../organizationTree";
import { apiErrorMessage } from "../../access/apiErrorMessage";
import { RolesManager } from "./RolesManager";

// Access levels belong to the church, so every node of a church shows the same list
// and managing them needs iam.manage on the church itself.
export default function RolesPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const { data: nodes } = useGetMeOrganizations();
  const church = churchOf(withIds(nodes), nodeId);
  const { can } = usePermissions(church?.id);
  const {
    data: roles,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdRoles(nodeId);
  const { data: catalog } = useGetIamPermissions();

  if (isLoading) return <Loading />;
  if (!roles) return <ResourceError error={error} />;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
    } catch (failure) {
      alert.showMessage(apiErrorMessage(failure, "No se pudo guardar."));
      throw failure;
    }
    await mutate();
    alert.showMessage(message);
  };

  return (
    <RolesManager
      roles={roles}
      catalog={catalog ?? []}
      canManage={can("iam.manage")}
      onCreate={(input) =>
        run(() => postOrganizationsByIdRoles(nodeId, input), "Nivel creado")
      }
      onUpdate={(id, input) =>
        run(() => putRolesByRoleId(id, input), "Nivel actualizado")
      }
      onDelete={(id) => run(() => deleteRolesByRoleId(id), "Nivel eliminado")}
    />
  );
}
