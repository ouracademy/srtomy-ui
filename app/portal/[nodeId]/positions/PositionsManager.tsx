"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Autocomplete,
  Box,
  Button,
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
import NextLink from "next/link";
import React from "react";
import type {
  PositionSuggestionResponse,
  PositionSummaryResponse,
  RoleResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import {
  NO_LEVEL,
  NO_LEVEL_LABEL,
  assignableLevels,
  levelLabel,
  toAccessRoleId,
} from "@/app/(components)/accessLevels";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";

type PositionsManagerProps = Readonly<{
  positions: PositionSummaryResponse[];
  levels: RoleResponse[];
  suggestions: PositionSuggestionResponse[];
  canManage: boolean;
  // Where the church's own access levels are edited; absent without iam.manage.
  levelsHref?: string;
  onCreate: (name: string, accessRoleId?: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onSetAccess: (id: string, accessRoleId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}>;

type Confirmation = Readonly<{
  title: string;
  message: string;
  confirmLabel: string;
  run: () => Promise<void>;
}>;

const people = (count: number) =>
  count === 1 ? "1 persona tiene" : `${count} personas tienen`;

// Positions (cargos) of a church: names like "Pastor" or "Catequista" that each
// church words its own way. A position may carry an access level, so whoever
// holds it can do in the app what that level allows; without one it is only a
// label for people who do not use the app.
export const PositionsManager = ({
  positions,
  levels,
  suggestions,
  canManage,
  levelsHref,
  onCreate,
  onRename,
  onSetAccess,
  onDelete,
}: PositionsManagerProps) => {
  const [newName, setNewName] = React.useState("");
  const [newLevel, setNewLevel] = React.useState(NO_LEVEL);
  const [creating, setCreating] = React.useState(false);
  const [renaming, setRenaming] =
    React.useState<PositionSummaryResponse | null>(null);
  const [deleting, setDeleting] =
    React.useState<PositionSummaryResponse | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(
    null,
  );

  const options = assignableLevels(levels);
  const taken = new Set(
    positions.map((p) => (p.name ?? "").toLocaleLowerCase("es")),
  );
  const available = suggestions
    .map((s) => s.name ?? "")
    .filter((name) => !taken.has(name.toLocaleLowerCase("es")));

  // Typing a common name proposes the level it usually has, until one is picked.
  const typeName = (name: string) => {
    setNewName(name);
    const suggested = suggestions.find(
      (s) => (s.name ?? "").toLocaleLowerCase("es") === name.toLowerCase(),
    );
    if (suggested?.suggestedRoleId && newLevel === NO_LEVEL) {
      setNewLevel(suggested.suggestedRoleId);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newName.trim(), toAccessRoleId(newLevel));
      setNewName("");
      setNewLevel(NO_LEVEL);
    } finally {
      setCreating(false);
    }
  };

  // Changing the level changes the access of everyone who holds the position,
  // so with holders it asks first.
  const changeLevel = (position: PositionSummaryResponse, level: string) => {
    const apply = () => onSetAccess(position.id ?? "", toAccessRoleId(level));
    if (!position.holders) {
      void apply();
      return;
    }
    setConfirmation({
      title: "Cambiar nivel de acceso",
      message: `${people(position.holders)} el cargo ${position.name}. Su acceso pasará de «${levelLabel(levels, position.accessRoleId)}» a «${levelLabel(levels, toAccessRoleId(level))}» de inmediato.`,
      confirmLabel: "Cambiar nivel",
      run: apply,
    });
  };

  const askDelete = (position: PositionSummaryResponse) => {
    if (position.accessRoleId && position.holders) {
      setConfirmation({
        title: "Eliminar cargo",
        message: `${people(position.holders)} el cargo ${position.name}, que da acceso «${levelLabel(levels, position.accessRoleId)}». Al eliminarlo perderán ese acceso.`,
        confirmLabel: "Eliminar",
        run: () => onDelete(position.id ?? ""),
      });
      return;
    }
    setDeleting(position);
  };

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 900 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" component="h1">
          Cargos de la iglesia
        </Typography>
        {levelsHref && (
          <Button component={NextLink} href={levelsHref} variant="outlined">
            Niveles de acceso personalizados
          </Button>
        )}
      </Stack>
      <Typography color="text.secondary">
        Nombre los cargos como los llaman en su iglesia. Cada cargo puede dar un
        nivel de acceso a la aplicación: quien lo tenga podrá hacer lo que ese
        nivel permite, en su sede, grupo o ministerio y en todo lo que cuelga de
        él. Sin nivel, el cargo es solo un nombre.
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
            label="Nivel de acceso del nuevo cargo"
            value={newLevel}
            onChange={(event) => setNewLevel(event.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value={NO_LEVEL}>{NO_LEVEL_LABEL}</MenuItem>
            {options.map((level) => (
              <MenuItem key={level.id} value={level.id}>
                {level.name}
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
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Cargos">
          <TableHead>
            <TableRow>
              <TableCell>Cargo</TableCell>
              <TableCell>Nivel de acceso</TableCell>
              <TableCell align="right">Personas</TableCell>
              {canManage && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>{position.name}</TableCell>
                <TableCell>
                  {canManage ? (
                    <TextField
                      select
                      size="small"
                      value={position.accessRoleId ?? NO_LEVEL}
                      onChange={(event) =>
                        changeLevel(position, event.target.value)
                      }
                      slotProps={{
                        select: {
                          SelectDisplayProps: {
                            "aria-label": `Nivel de acceso de ${position.name}`,
                          },
                        },
                      }}
                      sx={{ minWidth: 200 }}
                    >
                      <MenuItem value={NO_LEVEL}>{NO_LEVEL_LABEL}</MenuItem>
                      {options.map((level) => (
                        <MenuItem key={level.id} value={level.id}>
                          {level.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    levelLabel(levels, position.accessRoleId)
                  )}
                </TableCell>
                <TableCell align="right">{position.holders ?? 0}</TableCell>
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
            ))}
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
