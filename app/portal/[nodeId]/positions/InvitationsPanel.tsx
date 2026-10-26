"use client";

import {
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import React from "react";
import type {
  InvitationResponse,
  PersonResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { InviteDialog } from "./InviteDialog";
import { toInvitationRequest } from "./invitationForm";

type InvitationsPanelProps = Readonly<{
  nodeId: string;
  invitations: InvitationResponse[];
  positions: PositionSummaryResponse[];
  // Person to invite right away (coming back from registering them).
  initialPerson?: PersonResponse;
  // Sends the invitation; resolves to false when the email could not be sent.
  onInvite: (
    request: ReturnType<typeof toInvitationRequest>,
  ) => Promise<boolean | void>;
  onRevoke: (id: string) => Promise<void>;
}>;

const emailStatusChips = {
  SENT: { label: "Enviado", color: "success" },
  PENDING: { label: "En cola", color: "warning" },
  FAILED: { label: "No salió", color: "error" },
} as const;

// Whether the email with the link left. In the queue it is retried on its own.
const EmailStatusChip = ({ status }: Readonly<{ status?: string }>) => {
  const chip = emailStatusChips[status as keyof typeof emailStatusChips];
  return chip ? (
    <Chip
      size="small"
      color={chip.color}
      variant="outlined"
      label={chip.label}
    />
  ) : null;
};

// Invitations to use the app: who was invited, as what, and until when. An
// invitation links the invited person's account to a person of the church and
// gives them the position. The "Invitar" dialog asks for an email or a person. Inviting the same email again resends it.
export const InvitationsPanel = ({
  nodeId,
  invitations,
  positions,
  initialPerson,
  onInvite,
  onRevoke,
}: InvitationsPanelProps) => {
  const [inviting, setInviting] = React.useState(initialPerson !== undefined);
  const [notSent, setNotSent] = React.useState(false);
  const [revoking, setRevoking] = React.useState<InvitationResponse | null>(
    null,
  );

  const invite: typeof onInvite = async (request) => {
    const delivered = await onInvite(request);
    setNotSent(delivered === false);
    return delivered;
  };

  // Inviting the same email again replaces the invitation and queues a new email.
  const resend = async (invitation: InvitationResponse) => {
    try {
      await invite(
        toInvitationRequest({
          email: invitation.email ?? "",
          positionId: invitation.positionId ?? "",
          personId: invitation.personId ?? "",
        }),
      );
    } catch {
      // The caller already told the user why.
    }
  };

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        Invite por correo a quien va a usar la aplicación. Al aceptar, queda
        vinculado a su ficha (o se crea una con su nombre) y recibe el cargo que
        elija aquí. Solo puede invitar con cargos cuyos permisos usted también
        tenga.
      </Typography>
      <div>
        <Button
          variant="contained"
          sx={primaryButtonSx}
          onClick={() => setInviting(true)}
        >
          Invitar
        </Button>
      </div>
      <InviteDialog
        open={inviting}
        nodeId={nodeId}
        positions={positions}
        initialPerson={initialPerson}
        registerHref={`/portal/${nodeId}/person/create?next=${encodeURIComponent(
          `/portal/${nodeId}/positions?tab=invitaciones`,
        )}`}
        onClose={() => setInviting(false)}
        onInvite={invite}
      />
      {notSent && (
        <Alert severity="warning" onClose={() => setNotSent(false)}>
          La invitación se guardó, pero el correo aún no sale. Se reintenta
          solo; también puede reenviarlo desde la tabla.
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
              <TableCell>Correo</TableCell>
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
                <TableCell>
                  <EmailStatusChip status={invitation.emailStatus} />
                </TableCell>
                <TableCell align="right">
                  {invitation.emailStatus !== "SENT" && (
                    <Button
                      size="small"
                      aria-label={`Reenviar la invitación a ${invitation.email}`}
                      onClick={() => resend(invitation)}
                    >
                      Reenviar
                    </Button>
                  )}
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
