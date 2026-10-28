"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Container } from "@mui/material";
import React from "react";
import {
  postPublicAttendanceByToken,
  useGetPublicAttendanceByToken,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { AttendanceSelfPage } from "./AttendanceSelfPage";

// /a/{token}: the page of the QR of an event. Anyone who scans it can mark that
// they came; the code only works around the event and is renewed every few
// minutes, so one that was not made by us answers 404.
export default function AttendanceSelfRoute(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(props.params);
  const {
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
  } = useAuth0();
  const { data, error, isLoading } = useGetPublicAttendanceByToken(token, {
    swr: { revalidateOnFocus: false },
  });

  if (authLoading || isLoading) return <Loading />;
  if (!data) {
    return (
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <ResourceError error={error} />
      </Container>
    );
  }

  return (
    <AttendanceSelfPage
      welcome={data}
      signedIn={isAuthenticated}
      onSignIn={() =>
        loginWithRedirect({ appState: { returnTo: `/a/${token}` } })
      }
      onMark={async (name) => {
        try {
          return await postPublicAttendanceByToken(token, name ? { name } : {});
        } catch (failure) {
          return apiErrorMessage(
            failure,
            "No se pudo marcar su asistencia. Intente nuevamente",
          );
        }
      }}
    />
  );
}
