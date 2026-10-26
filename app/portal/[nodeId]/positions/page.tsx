"use client";

import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import {
  deleteInvitationsById,
  deleteOrganizationsByIdOwnersByBindingId,
  deletePositionsById,
  postOrganizationsByIdInvitations,
  postOrganizationsByIdOwners,
  postOrganizationsByIdPositions,
  putPositionsById,
  putPositionsByIdAccess,
  useGetIamPermissions,
  useGetMe,
  useGetMeOrganizations,
  useGetOrganizationsById,
  useGetOrganizationsByIdAccess,
  useGetOrganizationsByIdInvitations,
  useGetOrganizationsByIdPositions,
  useGetPeopleById,
  useGetPositionsSuggestions,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { churchOf, withIds } from "../../organizationTree";
import { AccessList, OwnersPanel } from "../access/AccessManager";
import { InvitationsPanel } from "./InvitationsPanel";
import { PositionsManager } from "./PositionsManager";

type TabName = "positions" | "access" | "owners" | "invitations";

// Positions belong to the church, so every node of a church shows the same
// list. The screen has everything about who can do what: the positions and
// their permissions, the people who have access and why, and the Owners.
export default function PositionsPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const alert = React.useContext(SnackbarContext);
  // Coming back from registering a person to invite: ?tab=invitaciones&persona=id.
  const query = new URLSearchParams(
    React.useSyncExternalStore(
      () => () => undefined,
      () => globalThis.location.search,
      () => "",
    ),
  );
  const invitePersonId = query.get("persona") ?? "";
  const [chosenTab, setTab] = React.useState<TabName | null>(null);
  const tab: TabName =
    chosenTab ??
    (query.get("tab") === "invitaciones" ? "invitations" : "positions");
  const { data: invitePerson, isLoading: loadingInvitePerson } =
    useGetPeopleById(invitePersonId, {
      swr: { enabled: invitePersonId !== "" },
    });
  const { data: nodes } = useGetMeOrganizations();
  const { data: me } = useGetMe();
  const church = churchOf(withIds(nodes), nodeId);
  const { can: canInChurch } = usePermissions(church?.id);
  const { can } = usePermissions(nodeId);
  const canReadAccess = can("iam.read");
  const canInvite = can("invitations.send");
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

  const { data: invitations, mutate: mutateInvitations } =
    useGetOrganizationsByIdInvitations(nodeId, {
      swr: {
        enabled: canInvite,
        // Emails still in the queue leave within minutes: keep looking.
        refreshInterval: (latest) =>
          latest?.some((invitation) => invitation.emailStatus === "PENDING")
            ? 20000
            : 0,
      },
    });

  if (isLoading || (invitePersonId !== "" && loadingInvitePerson)) {
    return <Loading />;
  }
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

  // Sends the invitation. Resolves to whether the email went out; a refusal
  // (for example a position with more permissions than the user has) is
  // shown and rethrown so the form keeps what was typed.
  const invite = async (
    request: Parameters<typeof postOrganizationsByIdInvitations>[1],
  ) => {
    try {
      const result = await postOrganizationsByIdInvitations(nodeId, request);
      await mutateInvitations();
      alert.showMessage(
        result.emailSent
          ? "Invitación enviada"
          : "Invitación guardada; el correo sale en unos minutos",
      );
      return result.emailSent;
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo invitar. Intente nuevamente"),
      );
      throw failure;
    }
  };

  const isChurch = node?.type === "CHURCH";
  const current: TabName =
    (tab === "access" && !canReadAccess) ||
    (tab === "owners" && !isChurch) ||
    (tab === "invitations" && !canInvite)
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
        {canInvite && <Tab value="invitations" label="Invitaciones" />}
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
        {current === "invitations" && (
          <InvitationsPanel
            key={invitePerson?.id ?? "none"}
            nodeId={nodeId}
            initialPerson={invitePerson}
            invitations={invitations ?? []}
            positions={positions}
            onInvite={invite}
            onRevoke={(id) =>
              run(() => deleteInvitationsById(id), "Invitación cancelada").then(
                () => mutateInvitations().then(() => undefined),
              )
            }
          />
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
