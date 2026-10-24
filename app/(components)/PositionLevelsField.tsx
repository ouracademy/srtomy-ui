"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Autocomplete,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import type {
  PositionSuggestionResponse,
  RoleResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { NO_LEVEL, NO_LEVEL_LABEL, assignableLevels } from "./accessLevels";

export type PositionDraft = { name: string; accessRoleId: string };

type PositionLevelsFieldProps = Readonly<{
  value: PositionDraft[];
  onChange: (value: PositionDraft[]) => void;
  levels: RoleResponse[];
  suggestions: PositionSuggestionResponse[];
}>;

// The positions (cargos) a church starts with, each with its access level. The
// name autocompletes from common positions and takes the level they usually
// have, which the user can change. Any other name is accepted as typed.
export const PositionLevelsField = ({
  value,
  onChange,
  levels,
  suggestions,
}: PositionLevelsFieldProps) => {
  const options = assignableLevels(levels);
  const used = new Set(value.map((p) => p.name.trim().toLocaleLowerCase("es")));
  const free = suggestions
    .map((s) => s.name ?? "")
    .filter((name) => !used.has(name.toLocaleLowerCase("es")));

  const update = (index: number, change: Partial<PositionDraft>) =>
    onChange(value.map((p, i) => (i === index ? { ...p, ...change } : p)));

  const rename = (index: number, name: string) => {
    const suggested = suggestions.find(
      (s) => (s.name ?? "").toLocaleLowerCase("es") === name.toLowerCase(),
    );
    const untouched = value[index]?.accessRoleId === NO_LEVEL;
    update(index, {
      name,
      ...(suggested?.suggestedRoleId && untouched
        ? { accessRoleId: suggested.suggestedRoleId }
        : {}),
    });
  };

  return (
    <Stack spacing={2}>
      {value.map((position, index) => {
        const selected = options.find((l) => l.id === position.accessRoleId);
        return (
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
            <TextField
              select
              size="small"
              label={`Nivel de acceso del cargo ${index + 1}`}
              value={position.accessRoleId}
              onChange={(event) =>
                update(index, { accessRoleId: event.target.value })
              }
              helperText={selected?.description ?? undefined}
              sx={{ minWidth: 220, flex: 1 }}
            >
              <MenuItem value={NO_LEVEL}>{NO_LEVEL_LABEL}</MenuItem>
              {options.map((level) => (
                <MenuItem key={level.id} value={level.id}>
                  {level.name}
                </MenuItem>
              ))}
            </TextField>
            <IconButton
              aria-label={`Quitar cargo ${position.name || index + 1}`}
              onClick={() => onChange(value.filter((_p, i) => i !== index))}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        );
      })}
      <div>
        <Button
          startIcon={<AddIcon />}
          onClick={() =>
            onChange([...value, { name: "", accessRoleId: NO_LEVEL }])
          }
        >
          Agregar cargo
        </Button>
      </div>
    </Stack>
  );
};
