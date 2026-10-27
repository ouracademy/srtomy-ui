"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  PermissionGroupResponse,
  RoleResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  permissionLabel,
  resourceLabel,
} from "@/app/(components)/permissionLabels";
import {
  setGroup,
  togglePermission,
} from "@/app/(components)/permissionSelection";

export type RoleInput = {
  name: string;
  description: string;
  permissions: string[];
};

type RoleDialogProps = Readonly<{
  // The role being edited, or null to create a new one.
  role: RoleResponse | null;
  predefinedRoles: RoleResponse[];
  catalog: PermissionGroupResponse[];
  close: () => void;
  save: (input: RoleInput) => Promise<void>;
}>;

export const RoleDialog = ({
  role,
  predefinedRoles,
  catalog,
  close,
  save,
}: RoleDialogProps) => {
  const [name, setName] = React.useState(role?.name ?? "");
  const [description, setDescription] = React.useState(role?.description ?? "");
  const [permissions, setPermissions] = React.useState(role?.permissions ?? []);
  const [baseId, setBaseId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const startFrom = (id: string) => {
    setBaseId(id);
    const base = predefinedRoles.find((candidate) => candidate.id === id);
    setPermissions(base?.permissions ?? []);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await save({ name: name.trim(), description, permissions });
      close();
    } catch {
      // The page already told the user why; keep the dialog open to retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{role ? "Editar nivel" : "Nuevo nivel"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nombre"
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Descripción"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
          />
          {!role && (
            <TextField
              select
              label="Crear a partir de"
              value={baseId}
              onChange={(event) => startFrom(event.target.value)}
              helperText="Parte de los permisos de un nivel predefinido o de cero."
            >
              <MenuItem value="">Desde cero</MenuItem>
              {predefinedRoles.map((base) => (
                <MenuItem key={base.id} value={base.id}>
                  {base.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {catalog.map((group) => {
            const values = group.permissions ?? [];
            const all = values.every((value) => permissions.includes(value));
            return (
              <FormGroup
                key={group.resource}
                role="group"
                aria-label={resourceLabel(group.resource ?? "")}
              >
                <FormControlLabel
                  label={
                    <Typography fontWeight={600}>
                      {resourceLabel(group.resource ?? "")}
                    </Typography>
                  }
                  control={
                    <Checkbox
                      checked={all}
                      onChange={(event) =>
                        setPermissions(
                          setGroup(permissions, values, event.target.checked),
                        )
                      }
                    />
                  }
                />
                {values.map((value) => (
                  <FormControlLabel
                    key={value}
                    sx={{ ml: 3 }}
                    label={permissionLabel(value)}
                    control={
                      <Checkbox
                        checked={permissions.includes(value)}
                        onChange={() =>
                          setPermissions(togglePermission(permissions, value))
                        }
                      />
                    }
                  />
                ))}
              </FormGroup>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          loading={saving}
          disabled={!name.trim() || permissions.length === 0}
          onClick={submit}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
