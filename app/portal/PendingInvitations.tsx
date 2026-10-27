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
import {
  AcceptNameFields,
  hasBothNames,
} from "@/app/(components)/AcceptNameFields";
import type { PersonName } from "@/app/portal/userNames";
import type { InvitationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

type PendingInvitationsProps = Readonly<{
  invitations: InvitationResponse[];
  // Name to propose when an invitation needs one (from the sign-in profile).
  suggestedName?: PersonName;
  // Resolves with an error message when the invitation was refused. The name
  // is given only when the invitation needs it.
  accept: (
    invitation: InvitationResponse,
    name?: PersonName,
  ) => Promise<string | void>;
  // "Mi espacio" always shows the section; the portal home only when needed.
  showEmpty?: boolean;
}>;

// Invitations waiting for the email of the signed-in user, shown to someone
// who has no church yet (or any time they open the portal home).
export const PendingInvitations = ({
  invitations,
  suggestedName,
  accept,
  showEmpty = false,
}: PendingInvitationsProps) => {
  const [accepting, setAccepting] = React.useState<string | null>(null);
  const [refusal, setRefusal] = React.useState<string | null>(null);

  const [asking, setAsking] = React.useState<string | null>(null);
  const [name, setName] = React.useState<PersonName | null>(null);
  const [triedWithoutName, setTriedWithoutName] = React.useState(false);
  const typedName = name ?? suggestedName ?? { firstName: "", lastName: "" };

  if (invitations.length === 0 && !showEmpty) return null;

  const run = async (invitation: InvitationResponse) => {
    if (invitation.needsName) {
      // First click asks for the name; the next one accepts with it.
      if (asking !== invitation.id) {
        setAsking(invitation.id ?? null);
        setTriedWithoutName(false);
        return;
      }
      if (!hasBothNames(typedName)) {
        setTriedWithoutName(true);
        return;
      }
    }
    setAccepting(invitation.id ?? "");
    try {
      setRefusal(
        (await accept(
          invitation,
          invitation.needsName ? typedName : undefined,
        )) ?? null,
      );
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
      {invitations.length === 0 && (
        <Typography color="text.secondary">
          No tienes invitaciones pendientes.
        </Typography>
      )}
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
            {asking === invitation.id && (
              <AcceptNameFields
                value={typedName}
                onChange={setName}
                showErrors={triedWithoutName}
              />
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
