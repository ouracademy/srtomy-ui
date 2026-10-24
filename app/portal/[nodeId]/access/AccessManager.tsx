"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LoadingButton from "@mui/lab/LoadingButton";
import {
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
import React from "react";
import type { AccessEntryResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";

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

// What an access allows: the role it comes from, or how many permissions a
// position gives (a position can mix several).
export const accessLabel = (entry: AccessEntryResponse) => {
  if (entry.roleName) return entry.roleName;
  const count = entry.permissionCount ?? 0;
  return `${count} ${count === 1 ? "permiso" : "permisos"}`;
};

type AccessListProps = Readonly<{
  entries: AccessEntryResponse[];
  // Marks the signed-in user's own row.
  currentUserId?: string;
}>;

type PersonAccess = Readonly<{
  userId?: string;
  email?: string;
  entries: AccessEntryResponse[];
}>;

/** One row per person: someone can have access from several places at once. */
export const groupByPerson = (entries: AccessEntryResponse[]) => {
  const people = new Map<string, AccessEntryResponse[]>();
  for (const entry of entries) {
    const key = entry.userId ?? entry.email ?? "";
    people.set(key, [...(people.get(key) ?? []), entry]);
  }
  return [...people.values()].map((own): PersonAccess => ({
    userId: own[0]?.userId,
    email: own[0]?.email,
    entries: own,
  }));
};

// Who can do things in a node and why. Access is not handed out here: it comes
// from the permissions of the position each person holds, so the way to change
// it is the Cargos tab.
export const AccessList = ({ entries, currentUserId }: AccessListProps) => {
  const [filter, setFilter] = React.useState("");
  const text = filter.trim().toLocaleLowerCase("es");
  const people = groupByPerson(entries);
  const shown = text
    ? people.filter((person) =>
        [
          person.email,
          ...person.entries.flatMap((e) => [accessLabel(e), originLabel(e)]),
        ]
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(text),
      )
    : people;

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        El acceso viene del cargo que tiene cada persona y vale para este lugar
        y para todo lo que cuelga de él. Para dar o quitar acceso, cambie los
        permisos del cargo o el cargo de la persona.
      </Typography>
      <TextField
        label="Filtrar por correo, cargo o permisos"
        size="small"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Personas con acceso">
          <TableHead>
            <TableRow>
              <TableCell>Correo</TableCell>
              <TableCell>Acceso</TableCell>
              <TableCell>Origen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((person) => (
              <TableRow key={person.userId ?? person.email}>
                <TableCell>
                  {person.email}
                  {currentUserId && person.userId === currentUserId && (
                    <Chip size="small" sx={{ ml: 1 }} label="Tú" />
                  )}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {person.entries.map((entry) => (
                      <Typography key={entryKey(entry)} variant="body2">
                        {accessLabel(entry)}
                      </Typography>
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {person.entries.map((entry) => (
                      <Typography key={entryKey(entry)} variant="body2">
                        {originLabel(entry)}
                        {entry.inherited && entry.source === "DIRECT" && (
                          <Chip
                            size="small"
                            sx={{ ml: 1 }}
                            label={`Heredado de ${entry.organizationName}`}
                          />
                        )}
                      </Typography>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {shown.length === 0 && (
        <Typography color="text.secondary">
          {entries.length === 0 ? "Aún no hay accesos." : "Sin resultados."}
        </Typography>
      )}
    </Stack>
  );
};

const entryKey = (entry: AccessEntryResponse) =>
  `${entry.roleId}-${entry.organizationId}-${entry.positionName ?? entry.source}`;

type OwnersPanelProps = Readonly<{
  entries: AccessEntryResponse[];
  canManage: boolean;
  onAddOwner: (email: string) => Promise<void>;
  onRemoveOwner: (bindingId: string) => Promise<void>;
}>;

// Owners control the whole church and do not depend on a position, so they are
// the one access added and removed directly.
export const OwnersPanel = ({
  entries,
  canManage,
  onAddOwner,
  onRemoveOwner,
}: OwnersPanelProps) => {
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
    <Stack spacing={1}>
      <Typography color="text.secondary">
        Los Propietarios controlan toda la iglesia y no dependen de un cargo. La
        iglesia siempre conserva al menos uno.
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
