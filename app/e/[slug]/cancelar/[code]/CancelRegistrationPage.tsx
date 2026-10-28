"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import { Alert, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import React from "react";
import { sharedEventPath } from "@/app/(components)/eventSharing";

type CancelRegistrationPageProps = Readonly<{
  slug: string;
  // Cancels the sign-up; resolves with the reason when it failed.
  onCancel: () => Promise<string | null>;
}>;

// The page behind the link to cancel a sign-up: it asks once and cancels.
export const CancelRegistrationPage = ({
  slug,
  onCancel,
}: CancelRegistrationPageProps) => {
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const cancel = async () => {
    setLoading(true);
    try {
      const reason = await onCancel();
      setFailure(reason);
      setDone(reason === null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 2, sm: 5 } }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Cancelar inscripción
        </Typography>
        {done ? (
          <Alert severity="success">
            Su inscripción se canceló. El lugar queda libre para otra persona.
          </Alert>
        ) : (
          <>
            <Typography>
              ¿Seguro que ya no va a asistir? Su lugar quedará libre.
            </Typography>
            {failure && <Alert severity="error">{failure}</Alert>}
            <LoadingButton
              variant="contained"
              color="error"
              loading={loading}
              onClick={cancel}
              sx={{ alignSelf: "flex-start" }}
            >
              Cancelar mi inscripción
            </LoadingButton>
          </>
        )}
        <Link href={sharedEventPath(slug)}>Volver al evento</Link>
      </Stack>
    </Container>
  );
};
