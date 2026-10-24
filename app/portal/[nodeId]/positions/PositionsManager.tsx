"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Autocomplete,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
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
import LoadingButton from "@mui/lab/LoadingButton";
import React from "react";
import type {
  PermissionGroupResponse,
  PositionSuggestionResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { PermissionPicker } from "@/app/(components)/PermissionPicker";
import { PermissionsInfo } from "@/app/(components)/PermissionsInfo";

type PositionsManagerProps = Readonly<{
  positions: PositionSummaryResponse[];
  suggestions: PositionSuggestionResponse[];
  catalog: PermissionGroupResponse[];
  canManage: boolean;
  onCreate: (name: string, permissions: string[]) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onSetPermissions: (id: string, permissions: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}>;

type Confirmation = Readonly<{
  title: string;
  message: string;
  confirmLabel: string;
  run: () => Promise<void>;
}>;

export const permissionsText = (count: number) =>
  count === 0
    ? "Sin acceso a la app"
    : `${count} ${count === 1 ? "permiso" : "permisos"}`;

// Only people with an account feel a change in what a position gives.
const withAccount = (position: PositionSummaryResponse) =>
  (position.holders ?? []).filter((holder) => holder.email).length;

const accounts = (count: number) =>
  count === 1
    ? "1 persona con cuenta tiene"
    : `${count} personas con cuenta tienen`;

// Positions (cargos) of a church: names like "Pastor" or "Catequista" that each
// church words its own way. A position gives permissions in the app to whoever
// holds it (in their sede, grupo or ministerio and below); without permissions
// it is only a name, for people who do not use the app.
export const PositionsManager = ({
  positions,
  suggestions,
  catalog,
  canManage,
  onCreate,
  onRename,
  onSetPermissions,
  onDelete,
}: PositionsManagerProps) => {
  const [newName, setNewName] = React.useState("");
  const [newPermissions, setNewPermissions] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [open, setOpen] = React.useState<string | null>(null);
  const [renaming, setRenaming] =
    React.useState<PositionSummaryResponse | null>(null);
  const [deleting, setDeleting] =
    React.useState<PositionSummaryResponse | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(
    null,
  );

  const taken = new Set(
    positions.map((p) => (p.name ?? "").toLocaleLowerCase("es")),
  );
  const available = suggestions
    .map((s) => s.name ?? "")
    .filter((name) => !taken.has(name.toLocaleLowerCase("es")));

  // Typing a common name brings the permissions it usually gives, until some
  // were chosen.
  const typeName = (name: string) => {
    setNewName(name);
    const suggested = suggestions.find(
      (s) => (s.name ?? "").toLocaleLowerCase("es") === name.toLowerCase(),
    );
    if (suggested?.permissions && newPermissions.length === 0) {
      setNewPermissions(suggested.permissions);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newName.trim(), newPermissions);
      setNewName("");
      setNewPermissions([]);
    } finally {
      setCreating(false);
    }
  };

  const savePermissions = (
    position: PositionSummaryResponse,
    permissions: string[],
  ) => {
    const apply = () => onSetPermissions(position.id ?? "", permissions);
    const affected = withAccount(position);
    if (!affected) return apply();
    setConfirmation({
      title: "Cambiar permisos del cargo",
      message: `${accounts(affected)} el cargo ${position.name}. Su acceso cambia de inmediato.`,
      confirmLabel: "Cambiar permisos",
      run: apply,
    });
    return Promise.resolve();
  };

  const askDelete = (position: PositionSummaryResponse) => {
    const affected = withAccount(position);
    if ((position.effectivePermissions ?? []).length > 0 && affected) {
      setConfirmation({
        title: "Eliminar cargo",
        message: `${accounts(affected)} el cargo ${position.name}. Al eliminarlo perderán el acceso que les da.`,
        confirmLabel: "Eliminar",
        run: () => onDelete(position.id ?? ""),
      });
      return;
    }
    setDeleting(position);
  };

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        Nombre los cargos como los llaman en su iglesia. Cada cargo puede dar
        permisos en la aplicación: quien lo tenga podrá hacer eso en su sede,
        grupo o ministerio y en todo lo que cuelga de él. Sin permisos, el cargo
        es solo un nombre.
      </Typography>
      {canManage && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Autocomplete
            freeSolo
            options={available}
            inputValue={newName}
            onInputChange={(_event, value) => typeName(value)}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField {...params} label="Nuevo cargo" size="small" />
            )}
          />
          <TextField
            select
            size="small"
            label="Copiar permisos de"
            value=""
            onChange={(event) =>
              setNewPermissions(
                positions.find((p) => p.id === event.target.value)
                  ?.effectivePermissions ?? [],
              )
            }
            sx={{ minWidth: 200 }}
          >
            {positions.map((position) => (
              <MenuItem key={position.id} value={position.id}>
                {position.name}
              </MenuItem>
            ))}
          </TextField>
          <LoadingButton
            variant="contained"
            loading={creating}
            onClick={create}
          >
            Agregar
          </LoadingButton>
        </Stack>
      )}
      {canManage && newName.trim() && (
        <Typography variant="body2" color="text.secondary">
          Se creará con {permissionsText(newPermissions.length).toLowerCase()}.
          Podrá cambiarlos al abrir el cargo.
        </Typography>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Cargos">
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              <TableCell>Cargo</TableCell>
              <TableCell>Acceso</TableCell>
              <TableCell align="right">Personas</TableCell>
              {canManage && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position) => {
              const expanded = open === position.id;
              return (
                <React.Fragment key={position.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label={`${expanded ? "Cerrar" : "Abrir"} ${position.name}`}
                        aria-expanded={expanded}
                        onClick={() =>
                          setOpen(expanded ? null : (position.id ?? null))
                        }
                      >
                        {expanded ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{position.name}</TableCell>
                    <TableCell>
                      {permissionsText(
                        (position.effectivePermissions ?? []).length,
                      )}
                      <PermissionsInfo
                        name={position.name ?? ""}
                        permissions={position.effectivePermissions ?? []}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {(position.holders ?? []).length}
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Box>
                          <IconButton
                            aria-label={`Renombrar ${position.name}`}
                            onClick={() => setRenaming(position)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            aria-label={`Eliminar ${position.name}`}
                            onClick={() => askDelete(position)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 5 : 4}
                      sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}
                    >
                      <Collapse in={expanded} unmountOnExit>
                        <PositionDetail
                          // Remount when the saved permissions change.
                          key={(position.permissions ?? []).join(",")}
                          position={position}
                          catalog={catalog}
                          canManage={canManage}
                          save={(permissions) =>
                            savePermissions(position, permissions)
                          }
                        />
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {positions.length === 0 && (
        <Typography color="text.secondary">Aún no hay cargos.</Typography>
      )}
      {renaming && (
        <RenameDialog
          position={renaming}
          close={() => setRenaming(null)}
          rename={(name) => onRename(renaming.id ?? "", name)}
        />
      )}
      <DialogDeleteConfirmation
        open={deleting !== null}
        close={() => setDeleting(null)}
        onDelete={async () => {
          await onDelete(deleting?.id ?? "");
          setDeleting(null);
        }}
      />
      {confirmation && (
        <ConfirmDialog
          confirmation={confirmation}
          close={() => setConfirmation(null)}
        />
      )}
    </Stack>
  );
};

const PositionDetail = ({
  position,
  catalog,
  canManage,
  save,
}: {
  position: PositionSummaryResponse;
  catalog: PermissionGroupResponse[];
  canManage: boolean;
  save: (permissions: string[]) => Promise<void>;
}) => {
  const saved = position.permissions ?? [];
  const [draft, setDraft] = React.useState(saved);
  const [saving, setSaving] = React.useState(false);
  // What the position gets from roles cannot be unchecked here.
  const locked = (position.effectivePermissions ?? []).filter(
    (permission) => !saved.includes(permission),
  );
  const changed =
    draft.length !== saved.length || draft.some((p) => !saved.includes(p));

  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Typography variant="subtitle1" component="h2" fontWeight={600}>
        Permisos de {position.name}
      </Typography>
      <PermissionPicker
        catalog={catalog}
        value={draft}
        onChange={setDraft}
        locked={locked}
        disabled={!canManage}
      />
      {canManage && (
        <div>
          <LoadingButton
            variant="contained"
            loading={saving}
            disabled={!changed}
            onClick={async () => {
              setSaving(true);
              try {
                await save(draft);
              } finally {
                setSaving(false);
              }
            }}
          >
            Guardar permisos
          </LoadingButton>
        </div>
      )}
      <Typography variant="subtitle1" component="h2" fontWeight={600}>
        Personas con este cargo
      </Typography>
      {(position.holders ?? []).length === 0 ? (
        <Typography color="text.secondary">Nadie tiene este cargo.</Typography>
      ) : (
        <Stack component="ul" sx={{ m: 0, pl: 3 }} spacing={0.5}>
          {(position.holders ?? []).map((holder) => (
            <li key={`${holder.personId}-${holder.organizationName}`}>
              <Typography variant="body2">
                {holder.name} · {holder.organizationName} ·{" "}
                {holder.email ?? "sin cuenta"}
              </Typography>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

const ConfirmDialog = ({
  confirmation,
  close,
}: {
  confirmation: Confirmation;
  close: () => void;
}) => {
  const [working, setWorking] = React.useState(false);
  return (
    <Dialog open onClose={close} fullWidth>
      <DialogTitle>{confirmation.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{confirmation.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={working}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          loading={working}
          onClick={async () => {
            setWorking(true);
            try {
              await confirmation.run();
              close();
            } finally {
              setWorking(false);
            }
          }}
        >
          {confirmation.confirmLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const RenameDialog = ({
  position,
  close,
  rename,
}: {
  position: PositionSummaryResponse;
  close: () => void;
  rename: (name: string) => Promise<void>;
}) => {
  const [name, setName] = React.useState(position.name ?? "");
  const [saving, setSaving] = React.useState(false);
  return (
    <Dialog open onClose={close} fullWidth>
      <DialogTitle>Renombrar cargo</DialogTitle>
      <DialogContent>
        <TextField
          label="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          disabled={!name.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await rename(name.trim());
              close();
            } finally {
              setSaving(false);
            }
          }}
        >
          Guardar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
