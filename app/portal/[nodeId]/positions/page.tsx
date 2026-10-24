"use client";

import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import {
  deleteOrganizationsByIdOwnersByBindingId,
  deletePositionsById,
  postOrganizationsByIdOwners,
  postOrganizationsByIdPositions,
  putPositionsById,
  putPositionsByIdAccess,
  useGetIamPermissions,
  useGetMe,
  useGetMeOrganizations,
  useGetOrganizationsById,
  useGetOrganizationsByIdAccess,
  useGetOrganizationsByIdPositions,
  useGetPositionsSuggestions,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { churchOf, withIds } from "../../organizationTree";
import { AccessList, OwnersPanel } from "../access/AccessManager";
import { PositionsManager } from "./PositionsManager";

type TabName = "positions" | "access" | "owners";

// Positions belong to the church, so every node of a church shows the same
// list. The screen has everything about who can do what: the positions and
// their permissions, the people who have access and why, and the Owners.
export default function PositionsPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  const [tab, setTab] = React.useState<TabName>("positions");
  const { data: nodes } = useGetMeOrganizations();
  const { data: me } = useGetMe();
  const church = churchOf(withIds(nodes), nodeId);
  const { can: canInChurch } = usePermissions(church?.id);
  const { can } = usePermissions(nodeId);
  const canReadAccess = can("iam.read");
  const { data: node } = useGetOrganizationsById(nodeId);
  const {
    data: positions,
    error,
    isLoading,
    mutate,
  } = useGetOrganizationsByIdPositions(nodeId);
  const { data: suggestions } = useGetPositionsSuggestions();
  const { data: catalog } = useGetIamPermissions();
  const { data: access, mutate: mutateAccess } = useGetOrganizationsByIdAccess(
    nodeId,
    { swr: { enabled: canReadAccess } },
  );

  if (isLoading) return <Loading />;
  if (!positions) return <ResourceError error={error} />;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(
          failure,
          "No se pudo guardar. ¿Ya existe un cargo con ese nombre?",
        ),
      );
      return;
    }
    await Promise.all([mutate(), mutateAccess()]);
    alert.showMessage(message);
  };

  const isChurch = node?.type === "CHURCH";
  const current: TabName =
    (tab === "access" && !canReadAccess) || (tab === "owners" && !isChurch)
      ? "positions"
      : tab;

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 1000 }}>
      <Typography variant="h5" component="h1">
        Cargos y accesos
      </Typography>
      <Tabs
        value={current}
        onChange={(_event, value: TabName) => setTab(value)}
        variant="scrollable"
        aria-label="Cargos y accesos"
      >
        <Tab value="positions" label="Cargos" />
        {canReadAccess && <Tab value="access" label="Personas con acceso" />}
        {canReadAccess && isChurch && (
          <Tab value="owners" label="Propietarios" />
        )}
      </Tabs>
      <Box role="tabpanel">
        {current === "positions" && (
          <PositionsManager
            positions={positions}
            suggestions={suggestions ?? []}
            catalog={catalog ?? []}
            canManage={canInChurch("positions.manage")}
            currentEmail={me?.email}
            onCreate={(name, permissions) =>
              run(
                () =>
                  postOrganizationsByIdPositions(nodeId, { name, permissions }),
                "Cargo agregado",
              )
            }
            onRename={(id, name) =>
              run(() => putPositionsById(id, { name }), "Cargo renombrado")
            }
            onSetPermissions={(id, permissions) =>
              run(
                () => putPositionsByIdAccess(id, { permissions }),
                "Permisos actualizados",
              )
            }
            onDelete={(id) =>
              run(() => deletePositionsById(id), "Cargo eliminado")
            }
          />
        )}
        {current === "access" && (
          <AccessList entries={access ?? []} currentUserId={me?.id} />
        )}
        {current === "owners" && (
          <OwnersPanel
            entries={access ?? []}
            canManage={can("iam.manage")}
            onAddOwner={(email) =>
              run(
                () => postOrganizationsByIdOwners(nodeId, { email }),
                "Propietario agregado",
              )
            }
            onRemoveOwner={(bindingId) =>
              run(
                () =>
                  deleteOrganizationsByIdOwnersByBindingId(nodeId, bindingId),
                "Propietario quitado",
              )
            }
          />
        )}
      </Box>
    </Stack>
  );
}
