"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import type {
  PermissionGroupResponse,
  PositionSuggestionResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { PermissionPicker } from "./PermissionPicker";

export type PositionDraft = { name: string; permissions: string[] };

type PositionsFieldProps = Readonly<{
  value: PositionDraft[];
  onChange: (value: PositionDraft[]) => void;
  catalog: PermissionGroupResponse[];
  suggestions: PositionSuggestionResponse[];
}>;

const permissionsText = (count: number) =>
  count === 0
    ? "Sin acceso a la app"
    : `${count} ${count === 1 ? "permiso" : "permisos"}`;

// The positions (cargos) a church starts with, each with the permissions it
// gives. A common name brings the permissions it usually has (a copy: they can
// be changed per position); any other name is accepted as typed.
export const PositionsField = ({
  value,
  onChange,
  catalog,
  suggestions,
}: PositionsFieldProps) => {
  const [editing, setEditing] = React.useState<number | null>(null);
  const used = new Set(value.map((p) => p.name.trim().toLocaleLowerCase("es")));
  const free = suggestions
    .map((s) => s.name ?? "")
    .filter((name) => !used.has(name.toLocaleLowerCase("es")));

  const update = (index: number, change: Partial<PositionDraft>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...change } : p)));

  // Typing a common name proposes its permissions while the row has none yet.
  const rename = (index: number, name: string) => {
    const suggested = suggestions.find(
      (s) => (s.name ?? "").toLocaleLowerCase("es") === name.toLowerCase(),
    );
    const untouched = (value[index]?.permissions.length ?? 0) === 0;
    update(index, {
      name,
      ...(suggested?.permissions && untouched
        ? { permissions: suggested.permissions }
        : {}),
    });
  };

  return (
    <Stack spacing={2}>
      {value.map((position, index) => (
        <Stack
          // Rows have no stable id; the order is the identity while editing.
          key={index}
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ sm: "flex-start" }}
        >
          <Autocomplete
            freeSolo
            options={free}
            inputValue={position.name}
            onInputChange={(_event, name) => rename(index, name)}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Cargo ${index + 1}`}
                size="small"
              />
            )}
          />
          <Button
            variant="outlined"
            onClick={() => setEditing(index)}
            aria-label={`Permisos del cargo ${index + 1}`}
            sx={{ minWidth: 200 }}
          >
            {permissionsText(position.permissions.length)}
          </Button>
          <IconButton
            aria-label={`Quitar cargo ${position.name || index + 1}`}
            onClick={() => onChange(value.filter((_p, i) => i !== index))}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      <div>
        <Button
          startIcon={<AddIcon />}
          onClick={() => onChange([...value, { name: "", permissions: [] }])}
        >
          Agregar cargo
        </Button>
      </div>
      {editing !== null && value[editing] && (
        <Dialog open onClose={() => setEditing(null)} fullWidth maxWidth="sm">
          <DialogTitle>
            Permisos de {value[editing].name || `cargo ${editing + 1}`}
          </DialogTitle>
          <DialogContent>
            <PermissionPicker
              catalog={catalog}
              value={value[editing].permissions}
              onChange={(permissions) => update(editing, { permissions })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Listo</Button>
          </DialogActions>
        </Dialog>
      )}
    </Stack>
  );
};
