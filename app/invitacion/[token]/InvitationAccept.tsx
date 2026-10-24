"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import React from "react";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import type { InvitationPreviewResponse } from "@/app/(api)/generated/aPISrTommy.schemas";

type InvitationAcceptProps = Readonly<{
  invitation: InvitationPreviewResponse;
  signedIn: boolean;
  // Email of the signed-in user, to say when it is not the invited one.
  currentEmail?: string;
  // The account is ready (registered in the API) and the invitation can be
  // accepted.
  ready: boolean;
  signIn: () => void;
  signOut: () => void;
  // Resolves with an error message when the invitation was refused.
  accept: () => Promise<string | void>;
}>;

const closedMessages: Record<string, string> = {
  EXPIRED: "Esta invitación venció. Pida a quien lo invitó que envíe otra.",
  REVOKED: "Esta invitación fue cancelada.",
  ACCEPTED: "Esta invitación ya fue aceptada.",
};

// What someone sees when they open the link of an invitation: where they are
// invited and as what, and the way to accept it (signing in first, with the
// email the invitation was sent to).
export const InvitationAccept = ({
  invitation,
  signedIn,
  currentEmail,
  ready,
  signIn,
  signOut,
  accept,
}: InvitationAcceptProps) => {
  const [accepting, setAccepting] = React.useState(false);
  const [refusal, setRefusal] = React.useState<string | null>(null);
  const closed = closedMessages[invitation.status ?? "PENDING"];

  const run = async () => {
    setAccepting(true);
    try {
      setRefusal((await accept()) ?? null);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ display: "flex", justifyContent: "center", p: { xs: 2, sm: 6 } }}
    >
      <Paper variant="outlined" sx={{ maxWidth: 520, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1">
            Lo invitaron a {invitation.organizationName}
          </Typography>
          <Typography>
            {invitation.positionName
              ? `Con el cargo ${invitation.positionName}. `
              : ""}
            La invitación es para <strong>{invitation.email}</strong>: inicie
            sesión o cree su cuenta con ese mismo correo.
          </Typography>
          {closed && <Alert severity="info">{closed}</Alert>}
          {refusal && <Alert severity="error">{refusal}</Alert>}
          {!closed && !signedIn && (
            <Button variant="contained" sx={primaryButtonSx} onClick={signIn}>
              Iniciar sesión o crear cuenta
            </Button>
          )}
          {!closed && signedIn && (
            <>
              {currentEmail && (
                <Typography variant="body2" color="text.secondary">
                  Sesión iniciada como {currentEmail}.
                </Typography>
              )}
              <LoadingButton
                variant="contained"
                sx={primaryButtonSx}
                loading={accepting}
                disabled={!ready}
                onClick={run}
              >
                Aceptar invitación
              </LoadingButton>
              <Button onClick={signOut}>Usar otra cuenta</Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};
