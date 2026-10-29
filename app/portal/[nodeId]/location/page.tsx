"use client";

import { Box } from "@mui/material";
import React from "react";
import { useSWRConfig } from "swr";
import {
  getGetMeOrganizationsKey,
  putOrganizationsById,
  putOrganizationsLocationsChildsById,
  useGetOrganizationsById,
} from "@/app/(api)/generated";
import type { OrganizationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { copyLink } from "@/app/(components)/copyLink";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { nodeTypeLabels } from "@/app/portal/organizationTree";
import { LocationForm } from "./LocationForm";
import { toOrganizationForm, toOrganizationPayload } from "./LocationSchema";
import { GroupForm } from "./groups/GroupForm";
import { Groups } from "./groups/Groups";
import {
  toGroupInitialValues,
  toUpdateLocationChildRequest,
} from "./groups/groupEdit";

// Details of the current node, whatever its type, and the nodes under it.
export default function NodeDetails(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const {
    data: node,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsById(nodeId);
  const { can } = usePermissions(nodeId);

  if (isLoading) return <Loading />;
  if (!node) return <ResourceError error={error} />;

  const isGroup = node.type === "GROUP" || node.type === "MINISTRY";

  return (
    <Box>
      {isGroup ? (
        <GroupDetails node={node} canSave={can("org.update")} />
      ) : (
        <ChurchOrLocationDetails
          node={node}
          canSave={can("org.update")}
          onSaved={() => mutate()}
        />
      )}
      <Groups
        nodeId={nodeId}
        isChurch={node.type === "CHURCH"}
        insideGroup={node.type === "GROUP" || node.type === "MINISTRY"}
        canCreate={can("org.create_child")}
        canDelete={can("org.delete")}
      />
    </Box>
  );
}

const ChurchOrLocationDetails = ({
  node,
  canSave,
  onSaved,
}: {
  node: OrganizationResponse;
  canSave: boolean;
  onSaved: () => void;
}) => {
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();
  return (
    <LocationForm
      title={`Datos de la ${nodeTypeLabels[node.type ?? ""]?.toLowerCase() ?? "organización"}`}
      initialValues={toOrganizationForm(node)}
      canSave={canSave}
      slug={node.slug}
      onCopy={(url) => copyLink(url, alert.showMessage)}
      submit={async (values) => {
        await putOrganizationsById(
          node.id ?? "",
          toOrganizationPayload(values, { description: node.description }),
        );
        onSaved();
        // The breadcrumb and the picker show node names.
        await mutate(getGetMeOrganizationsKey());
        alert.showMessage("Guardado exitosamente");
      }}
    />
  );
};

const GroupDetails = ({
  node,
  canSave,
}: {
  node: OrganizationResponse;
  canSave: boolean;
}) => {
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();

  return (
    <GroupForm
      initialValues={toGroupInitialValues(node)}
      canSave={canSave}
      slug={node.slug}
      onCopy={(url) => copyLink(url, alert.showMessage)}
      submit={async (values) => {
        try {
          await putOrganizationsLocationsChildsById(
            node.id ?? "",
            toUpdateLocationChildRequest(values),
          );
        } catch {
          alert.showMessage("No se pudo guardar. Intente nuevamente");
          return;
        }
        await mutate(getGetMeOrganizationsKey());
        alert.showMessage("Guardado exitosamente");
      }}
    />
  );
};
