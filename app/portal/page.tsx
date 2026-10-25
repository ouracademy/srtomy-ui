"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Box, List, ListItem, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import {
  getOrganizationsByIdChilds,
  postMeInvitationsByIdAccept,
  postOrganizations,
  useGetMe,
  useGetMeInvitations,
  useGetMeSharedEvents,
  useGetMeOrganizations,
} from "@/app/(api)/generated";
import type { InvitationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import Loading from "../(components)/Loading";
import { ResourceError } from "../(components)/ResourceError";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { apiErrorMessage } from "../(components)/apiErrorMessage";
import { CreateChurchForm } from "./CreateChurchForm";
import { toCreateChurchRequest } from "./CreateChurchSchema";
import { readLastNode, saveLastNode } from "./lastNode";
import MenuDrawer from "./MenuDrawer";
import { PendingInvitations } from "./PendingInvitations";
import { SharedWithMe } from "./SharedWithMe";
import { pickLandingNode, withIds } from "./organizationTree";
import { suggestedNames, type PersonName } from "./userNames";

// Entry point of the portal. Someone who already belongs to a church goes
// straight to the node they last used; someone new creates their church.
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
  const { data: invitations } = useGetMeInvitations();
  const { data: sharedEvents } = useGetMeSharedEvents();
  const nodes = withIds(data);
  const wantsNewChurch =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("nueva");
  const landing = wantsNewChurch
    ? undefined
    : pickLandingNode(nodes, readLastNode());

  React.useEffect(() => {
    if (landing) router.replace(`/portal/${landing.id}`);
  }, [landing, router]);

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

  // Accepting links the user to their person of the church and opens the node.
  const acceptInvitation = async (
    invitation: InvitationResponse,
    name?: PersonName,
  ) => {
    try {
      const joined = await postMeInvitationsByIdAccept(
        invitation.id ?? "",
        name,
      );
      await mutateOrganizations();
      alert.showMessage("Invitación aceptada");
      saveLastNode(joined.organizationId ?? "");
      router.push(`/portal/${joined.organizationId}`);
      return undefined;
    } catch (failure) {
      return apiErrorMessage(
        failure,
        "No se pudo aceptar la invitación. Intente nuevamente",
      );
    }
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
