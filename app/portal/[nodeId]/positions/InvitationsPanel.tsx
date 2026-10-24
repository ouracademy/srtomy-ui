"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import React from "react";
import type {
  InvitationResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import {
  emptyInvitation,
  invitationErrors,
  toInvitationRequest,
  type InvitationFormValues,
} from "./invitationForm";

type InvitationsPanelProps = Readonly<{
  invitations: InvitationResponse[];
  positions: PositionSummaryResponse[];
  // Sends the invitation; resolves to false when the email could not be sent.
  onInvite: (
    request: ReturnType<typeof toInvitationRequest>,
  ) => Promise<boolean | void>;
  onRevoke: (id: string) => Promise<void>;
}>;

// Invitations to use the app: who was invited, as what, and until when. An
// invitation links the invited person's account to a person of the church and
// gives them the position. Inviting the same email again resends it.
export const InvitationsPanel = ({
  invitations,
  positions,
  onInvite,
  onRevoke,
}: InvitationsPanelProps) => {
  const [values, setValues] =
    React.useState<InvitationFormValues>(emptyInvitation);
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [notSent, setNotSent] = React.useState(false);
  const [revoking, setRevoking] = React.useState<InvitationResponse | null>(
    null,
  );
  const errors = submitted ? invitationErrors(values) : {};

  const set =
    (field: keyof InvitationFormValues) =>
    (event: { target: { value: string } }) =>
      setValues({ ...values, [field]: event.target.value });

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(invitationErrors(values)).length > 0) return;
    setSending(true);
    try {
      const delivered = await onInvite(toInvitationRequest(values));
      setNotSent(delivered === false);
      setValues(emptyInvitation);
      setSubmitted(false);
    } catch {
      // The caller already told the user why; what was typed stays to retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        Invite por correo a quien va a usar la aplicación. Al aceptar, queda
        vinculado a su ficha y recibe el cargo que elija aquí. Solo puede
        invitar con cargos cuyos permisos usted también tenga.
      </Typography>
      <Stack
        component="form"
        noValidate
        onSubmit={send}
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        aria-label="Invitar"
      >
        <TextField
          label="Correo"
          type="email"
          size="small"
          required
          value={values.email}
          onChange={set("email")}
          error={Boolean(errors.email)}
          helperText={errors.email}
          sx={{ flex: 2 }}
        />
        <TextField
          label="Nombre"
          size="small"
          required
          value={values.firstName}
          onChange={set("firstName")}
          error={Boolean(errors.firstName)}
          helperText={errors.firstName}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Apellido"
          size="small"
          required
          value={values.lastName}
          onChange={set("lastName")}
          error={Boolean(errors.lastName)}
          helperText={errors.lastName}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="Cargo"
          size="small"
          value={values.positionId}
          onChange={set("positionId")}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Sin cargo</MenuItem>
          {positions.map((position) => (
            <MenuItem key={position.id} value={position.id}>
              {position.name}
            </MenuItem>
          ))}
        </TextField>
        <LoadingButton
          type="submit"
          variant="contained"
          sx={primaryButtonSx}
          loading={sending}
        >
          Invitar
        </LoadingButton>
      </Stack>
      {notSent && (
        <Alert severity="warning" onClose={() => setNotSent(false)}>
          La invitación se guardó, pero no se pudo enviar el correo. Intente
          invitar de nuevo en un momento.
        </Alert>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Invitaciones pendientes">
          <TableHead>
            <TableRow>
              <TableCell>Correo</TableCell>
              <TableCell>Persona</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Vence</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>{invitation.personName}</TableCell>
                <TableCell>{invitation.positionName ?? "Sin cargo"}</TableCell>
                <TableCell>
                  {invitation.status === "EXPIRED" ? (
                    <Chip size="small" color="warning" label="Vencida" />
                  ) : (
                    format(invitation.expiresAt ?? new Date(0), "dd/MM/yyyy")
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    aria-label={`Cancelar la invitación de ${invitation.email}`}
                    onClick={() => setRevoking(invitation)}
                  >
                    Cancelar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {invitations.length === 0 && (
        <Typography color="text.secondary">
          No hay invitaciones pendientes.
        </Typography>
      )}
      <DialogDeleteConfirmation
        open={revoking !== null}
        close={() => setRevoking(null)}
        onDelete={async () => {
          await onRevoke(revoking?.id ?? "");
          setRevoking(null);
        }}
      />
    </Stack>
  );
};
