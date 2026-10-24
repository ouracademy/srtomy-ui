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
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import React from "react";
import type { PositionResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";

type PositionsManagerProps = Readonly<{
  positions: PositionResponse[];
  suggestions: string[];
  canManage: boolean;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}>;

// Positions (cargos) of a church: labels like "Pastor" or "Catequista" that
// each church words its own way. They describe people; they grant no access.
export const PositionsManager = ({
  positions,
  suggestions,
  canManage,
  onCreate,
  onRename,
  onDelete,
}: PositionsManagerProps) => {
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [renaming, setRenaming] = React.useState<PositionResponse | null>(null);
  const [deleting, setDeleting] = React.useState<PositionResponse | null>(null);

  const taken = new Set(
    positions.map((p) => (p.name ?? "").toLocaleLowerCase("es")),
  );
  const available = suggestions.filter(
    (s) => !taken.has(s.toLocaleLowerCase("es")),
  );

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 700 }}>
      <Typography variant="h5" component="h1">
        Cargos de la iglesia
      </Typography>
      <Typography color="text.secondary">
        Nombre los cargos como los llaman en su iglesia. Los cargos describen a
        las personas; no dan acceso a la aplicación.
      </Typography>
      {canManage && (
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Autocomplete
            freeSolo
            options={available}
            inputValue={newName}
            onInputChange={(_event, value) => setNewName(value)}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField {...params} label="Nuevo cargo" size="small" />
            )}
          />
          <LoadingButton
            variant="contained"
            loading={creating}
            onClick={create}
          >
            Agregar
          </LoadingButton>
        </Stack>
      )}
      <List aria-label="Cargos">
        {positions.map((position) => (
          <ListItem
            key={position.id}
            divider
            secondaryAction={
              canManage && (
                <Box>
                  <IconButton
                    aria-label={`Renombrar ${position.name}`}
                    onClick={() => setRenaming(position)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Eliminar ${position.name}`}
                    onClick={() => setDeleting(position)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
          >
            <ListItemText primary={position.name} />
          </ListItem>
        ))}
      </List>
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
    </Stack>
  );
};

const RenameDialog = ({
  position,
  close,
  rename,
}: {
  position: PositionResponse;
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
