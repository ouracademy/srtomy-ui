"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Alert, Button, Container, Stack } from "@mui/material";
import React from "react";
import {
  postPublicEventsBySlugRegistrations,
  useGetPublicEventsBySlug,
} from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { sharedEventPath } from "@/app/(components)/eventSharing";
import { SharedEventPage, type Registration } from "./SharedEventPage";

// Page of the link of an event or course (/e/{slug}). Anyone with an open link
// can see it and, if the link allows it, sign up without an account. One the
// visitor cannot open answers 404; signing in may be what it needs.
export default function SharedEventRoute(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(props.params);
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    loginWithRedirect,
  } = useAuth0();
  const { data, error, isLoading } = useGetPublicEventsBySlug(slug);

  if (authLoading || isLoading) return <Loading />;
  if (!data) {
    return (
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Stack spacing={2}>
          <ResourceError error={error} />
          {!isAuthenticated && (
            <Alert
              severity="info"
              action={
                <Button
                  color="inherit"
                  onClick={() =>
                    loginWithRedirect({
                      appState: { returnTo: sharedEventPath(slug) },
                    })
                  }
                >
                  Iniciar sesión
                </Button>
              }
            >
              Si le compartieron este enlace o es de la iglesia, inicie sesión
              con su correo.
            </Alert>
          )}
        </Stack>
      </Container>
    );
  }

  const register = async (values: Registration) => {
    try {
      const result = await postPublicEventsBySlugRegistrations(slug, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim() || undefined,
      });
      return Boolean(result.alreadyRegistered) ? true : false;
    } catch (failure) {
      return apiErrorMessage(
        failure,
        "No se pudo completar la inscripción. Intente nuevamente",
      );
    }
  };

  return (
    <SharedEventPage
      event={data}
      defaults={{
        firstName: user?.given_name,
        lastName: user?.family_name,
        email: user?.email,
      }}
      onRegister={register}
    />
  );
}
