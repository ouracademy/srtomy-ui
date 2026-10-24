"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useSWRConfig } from "swr";
import {
  getGetMeOrganizationsKey,
  postInvitationsByTokenAccept,
  useGetMe,
  useGetPublicInvitationsByToken,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { saveLastNode } from "@/app/portal/lastNode";
import { InvitationAccept } from "./InvitationAccept";

// Public page of an invitation link (/invitacion/{token}). Anyone can read
// what the invitation is; accepting needs a session, whose verified email the
// API compares with the invited one.
export default function InvitationPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(props.params);
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const { data: invitation, error } = useGetPublicInvitationsByToken(token);
  // Registers the user in the API; accepting needs them to exist there.
  const { data: me } = useGetMe({ swr: { enabled: isAuthenticated } });

  if (isLoading || (!invitation && !error)) return <Loading />;
  if (!invitation) return <ResourceError error={error} />;

  const accept = async (): Promise<string | void> => {
    try {
      const joined = await postInvitationsByTokenAccept(token);
      await mutate(getGetMeOrganizationsKey());
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
    <InvitationAccept
      invitation={invitation}
      signedIn={isAuthenticated}
      currentEmail={me?.email}
      ready={Boolean(me)}
      signIn={() =>
        loginWithRedirect({
          appState: { returnTo: `/invitacion/${token}` },
          authorizationParams: { login_hint: invitation.email },
        })
      }
      signOut={() =>
        logout({
          logoutParams: {
            returnTo: `${globalThis.location.origin}/invitacion/${token}`,
          },
        })
      }
      accept={accept}
    />
  );
}
