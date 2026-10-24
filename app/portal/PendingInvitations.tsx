"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import type { InvitationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";

type PendingInvitationsProps = Readonly<{
  invitations: InvitationResponse[];
  // Resolves with an error message when the invitation was refused.
  accept: (invitation: InvitationResponse) => Promise<string | void>;
}>;

// Invitations waiting for the email of the signed-in user, shown to someone
// who has no church yet (or any time they open the portal home).
export const PendingInvitations = ({
  invitations,
  accept,
}: PendingInvitationsProps) => {
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [refusal, setRefusal] = React.useState<string | null>(null);

  if (invitations.length === 0) return null;

  const run = async (invitation: InvitationResponse) => {
    setAccepting(invitation.id ?? "");
    try {
      setRefusal((await accept(invitation)) ?? null);
    } finally {
      setAccepting(null);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" component="h2">
        Tienes invitaciones
      </Typography>
      {refusal && <Alert severity="error">{refusal}</Alert>}
      <List>
        {invitations.map((invitation) => (
          <ListItem
            key={invitation.id}
            secondaryAction={
              <LoadingButton
                variant="contained"
                sx={primaryButtonSx}
                loading={accepting === invitation.id}
                disabled={accepting !== null}
                aria-label={`Aceptar la invitación a ${invitation.organizationName}`}
                onClick={() => run(invitation)}
              >
                Aceptar
              </LoadingButton>
            }
          >
            <ListItemText
              primary={invitation.organizationName}
              secondary={
                invitation.positionName
                  ? `Con el cargo ${invitation.positionName}`
                  : "Para usar la aplicación"
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
