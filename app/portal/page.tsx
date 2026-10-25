"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Box, List, ListItem, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import {
  getOrganizationsByIdChilds,
  postOrganizations,
  useGetMe,
  useGetMeInvitations,
  useGetMeSharedEvents,
  useGetMeOrganizations,
} from "@/app/(api)/generated";
import {
  hasManagementAccess,
  usePermissions,
} from "@/app/(hooks)/usePermissions";
import Loading from "../(components)/Loading";
import { ResourceError } from "../(components)/ResourceError";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { CreateChurchForm } from "./CreateChurchForm";
import { toCreateChurchRequest } from "./CreateChurchSchema";
import { readLastNode, saveLastNode } from "./lastNode";
import MenuDrawer from "./MenuDrawer";
import { PendingInvitations } from "./PendingInvitations";
import { SharedWithMe } from "./SharedWithMe";
import { pickLandingNode, withIds } from "./organizationTree";
import { useAcceptInvitation } from "./useAcceptInvitation";
import { suggestedNames } from "./userNames";

// Entry point of the portal. Someone who already belongs to a church goes
// straight to the node they last used, or to "Mi espacio" when they only are a
// plain member there; someone new creates their church.
// `?nueva=1` shows the form even to members, to create another church.
export default function PortalHome() {
  const router = useRouter();
  const { user } = useAuth0();
  const alert = React.useContext(SnackbarContext);
  // Registers the user on first sign-in (and refreshes their email).
  const { error: meError } = useGetMe();
  const {
    data,
    error,
    isLoading,
    mutate: mutateOrganizations,
  } = useGetMeOrganizations();
  // Accepting links the user to their person of the church; the landing logic
  // then opens the node (or "Mi espacio") from the refreshed tree.
  const acceptInvitation = useAcceptInvitation((joined) => {
    saveLastNode(joined.organizationId ?? "");
    router.push("/portal");
  });
  const { data: invitations } = useGetMeInvitations();
  const { data: sharedEvents } = useGetMeSharedEvents();
  const nodes = withIds(data);
  const wantsNewChurch =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("nueva");
  const landing = wantsNewChurch
    ? undefined
    : pickLandingNode(nodes, readLastNode());
  const { permissions, isLoading: loadingPermissions } = usePermissions(
    landing?.id,
  );

  React.useEffect(() => {
    if (!landing || loadingPermissions) return;
    router.replace(
      hasManagementAccess(permissions) ? `/portal/${landing.id}` : "/portal/me",
    );
  }, [landing, loadingPermissions, permissions, router]);

  if (isLoading || landing) return <Loading />;
  if (!data) return <ResourceError error={error ?? meError} />;

  const createChurch = async (
    values: Parameters<typeof toCreateChurchRequest>[0],
  ) => {
    const church = await postOrganizations(toCreateChurchRequest(values));
    const [location] = await getOrganizationsByIdChilds(church.id ?? "");
    await mutateOrganizations();
    alert.showMessage(
      `Iglesia registrada. Está en la sede "${location?.name ?? "principal"}"; puede cambiar de iglesia, sede o grupo desde el selector de arriba.`,
    );
    router.push(`/portal/${location?.id ?? church.id}`);
  };

  return (
    <MenuDrawer
      listDrawer={
        <List>
          <ListItem sx={{ display: "flex", flexDirection: "column" }}>
            <blockquote style={{ margin: ".5rem", color: "#fff" }}>
              Mejores son dos que uno; porque tienen mejor paga de su trabajo.
              Porque si caen, el uno levantará a su compañero; pero ¡ay del
              solo! que cuando caiga, no habrá segundo que lo levante.
              <br />
              <br />
              <em>Eclesiastés 4:9-10 (Reina-Valera 1960)</em>
            </blockquote>
          </ListItem>
        </List>
      }
    >
      <Box sx={{ maxWidth: 900, m: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {nodes.length > 0 ? "Registrar otra iglesia" : "Bienvenido"}
        </Typography>
        <SharedWithMe events={sharedEvents ?? []} />
        <PendingInvitations
          invitations={invitations ?? []}
          suggestedName={suggestedNames(user)}
          accept={acceptInvitation}
        />
        <Typography gutterBottom>
          Registre su iglesia y su primera sede para empezar. Si su iglesia ya
          usa Sr. Tommy, pida a su pastor o líder que lo invite.
        </Typography>
        <CreateChurchForm
          submit={createChurch}
          creatorName={suggestedNames(user)}
        />
      </Box>
    </MenuDrawer>
  );
}
