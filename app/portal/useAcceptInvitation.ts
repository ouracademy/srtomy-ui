"use client";

import React from "react";
import {
  postMeInvitationsByIdAccept,
  useGetMeOrganizations,
} from "@/app/(api)/generated";
import type { InvitationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { apiErrorMessage } from "../(components)/apiErrorMessage";
import type { PersonName } from "./userNames";

type Joined = Awaited<ReturnType<typeof postMeInvitationsByIdAccept>>;

// Accepts an invitation of the signed-in user: links them to their person of
// the church and refreshes their tree. `onJoined` decides where to go next.
// Resolves with an error message when the invitation was refused.
export const useAcceptInvitation = (onJoined: (joined: Joined) => void) => {
  const alert = React.useContext(SnackbarContext);
  const { mutate: mutateOrganizations } = useGetMeOrganizations();

  return async (
    invitation: InvitationResponse,
    name?: PersonName,
  ): Promise<string | undefined> => {
    try {
      const joined = await postMeInvitationsByIdAccept(
        invitation.id ?? "",
        name,
      );
      await mutateOrganizations();
      alert.showMessage("Invitación aceptada");
      onJoined(joined);
      return undefined;
    } catch (failure) {
      return apiErrorMessage(
        failure,
        "No se pudo aceptar la invitación. Intente nuevamente",
      );
    }
  };
};
