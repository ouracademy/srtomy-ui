"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Chip,
  IconButton,
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
import NextLink from "next/link";
import React from "react";
import type { AccessEntryResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";

type AccessManagerProps = Readonly<{
  entries: AccessEntryResponse[];
  canManage: boolean;
  // Owners are agreed on for the whole church, so they are managed there.
  isChurch: boolean;
  positionsHref: string;
  onAddOwner: (email: string) => Promise<void>;
  onRemoveOwner: (bindingId: string) => Promise<void>;
}>;

// Where an access comes from, in words: a position (here or inherited), the
// leadership of a group, or being an Owner of the church.
export const originLabel = (entry: AccessEntryResponse) => {
  switch (entry.source) {
    case "POSITION":
      return entry.inherited
        ? `Cargo ${entry.positionName} en ${entry.organizationName}`
        : `Cargo ${entry.positionName}`;
    case "LEADER":
      return `Líder de ${entry.organizationName}`;
    default:
      return "Propietario de la iglesia";
  }
};

// Who can do things in a node and why. Access is not handed out here: it comes
// from the access level of the position each person holds, so the way to change
// it is Cargos. Only Owners are added and removed directly.
export const AccessManager = ({
  entries,
  canManage,
  isChurch,
  positionsHref,
  onAddOwner,
  onRemoveOwner,
}: AccessManagerProps) => {
  const [email, setEmail] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState<AccessEntryResponse | null>(
    null,
  );

  const owners = entries.filter((entry) => entry.source === "DIRECT");

  const addOwner = async () => {
    setAdding(true);
    try {
      await onAddOwner(email.trim());
      setEmail("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 900 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" component="h1">
          Personas con acceso
        </Typography>
        <Button component={NextLink} href={positionsHref} variant="outlined">
          Cargos y niveles de acceso
        </Button>
      </Stack>
      <Typography color="text.secondary">
        El acceso viene del cargo que tiene cada persona: su nivel vale para
        este lugar y para todo lo que cuelga de él. Para dar o quitar acceso,
        cambie el nivel del cargo o el cargo de la persona.
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Personas con acceso">
          <TableHead>
            <TableRow>
              <TableCell>Correo</TableCell>
              <TableCell>Nivel de acceso</TableCell>
              <TableCell>Origen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={`${entry.userId}-${entry.roleId}-${entry.organizationId}-${entry.positionName ?? entry.source}`}
              >
                <TableCell>{entry.email}</TableCell>
                <TableCell>{entry.roleName}</TableCell>
                <TableCell>
                  {originLabel(entry)}
                  {entry.inherited && entry.source === "DIRECT" && (
                    <Chip
                      size="small"
                      sx={{ ml: 1 }}
                      label={`Heredado de ${entry.organizationName}`}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {entries.length === 0 && (
        <Typography color="text.secondary">Aún no hay accesos.</Typography>
      )}

      {isChurch && (
        <Stack spacing={1}>
          <Typography variant="h6" component="h2">
            Propietarios
          </Typography>
          <Typography color="text.secondary">
            Los Propietarios controlan toda la iglesia y no dependen de un
            cargo. La iglesia siempre conserva al menos uno.
          </Typography>
          <Stack component="ul" sx={{ m: 0, pl: 0, listStyle: "none" }}>
            {owners.map((owner) => (
              <Stack
                component="li"
                key={owner.bindingId}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography>{owner.email}</Typography>
                {canManage && (
                  <IconButton
                    aria-label={`Quitar Propietario ${owner.email}`}
                    onClick={() => setRemoving(owner)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                )}
              </Stack>
            ))}
          </Stack>
          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                label="Correo del nuevo Propietario"
                type="email"
                size="small"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                helperText="La persona debe haber iniciado sesión antes. Solo un Propietario puede agregar Propietarios."
                sx={{ flex: 1 }}
              />
              <LoadingButton
                variant="contained"
                loading={adding}
                disabled={!email.trim()}
                onClick={addOwner}
              >
                Agregar Propietario
              </LoadingButton>
            </Stack>
          )}
        </Stack>
      )}
      <DialogDeleteConfirmation
        open={removing !== null}
        close={() => setRemoving(null)}
        onDelete={async () => {
          await onRemoveOwner(removing?.bindingId ?? "");
          setRemoving(null);
        }}
      />
    </Stack>
  );
};
