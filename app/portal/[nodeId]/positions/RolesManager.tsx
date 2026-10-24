"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  PermissionGroupResponse,
  RoleResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { permissionLabel } from "./permissionLabels";
import { RoleDialog, type RoleInput } from "./RoleDialog";

type RolesManagerProps = Readonly<{
  roles: RoleResponse[];
  catalog: PermissionGroupResponse[];
  canManage: boolean;
  onCreate: (input: RoleInput) => Promise<void>;
  onUpdate: (id: string, input: RoleInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}>;

// Predefined roles are read-only; each church builds its own from the
// permission catalog, starting from scratch or from a predefined one.
export const RolesManager = ({
  roles,
  catalog,
  canManage,
  onCreate,
  onUpdate,
  onDelete,
}: RolesManagerProps) => {
  // `undefined` = closed, `null` = creating, a role = editing it.
  const [editing, setEditing] = React.useState<RoleResponse | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = React.useState<RoleResponse | null>(null);
  const predefinedRoles = roles.filter((role) => role.predefined);

  return (
    <Stack spacing={2} sx={{ maxWidth: 800 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" component="h2">
          Roles de la iglesia
        </Typography>
        {canManage && (
          <Button variant="contained" onClick={() => setEditing(null)}>
            Nuevo rol
          </Button>
        )}
      </Stack>
      <Typography color="text.secondary">
        Los roles predefinidos no se pueden editar. Cree los suyos eligiendo los
        permisos que necesita cada tarea.
      </Typography>
      <List aria-label="Roles">
        {roles.map((role) => (
          <ListItem
            key={role.id}
            divider
            secondaryAction={
              canManage &&
              !role.predefined && (
                <Box>
                  <IconButton
                    aria-label={`Editar ${role.name}`}
                    onClick={() => setEditing(role)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Eliminar ${role.name}`}
                    onClick={() => setDeleting(role)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
          >
            <ListItemText
              disableTypography
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={600}>{role.name}</Typography>
                  {role.predefined && <Chip size="small" label="Predefinido" />}
                </Stack>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {(role.permissions ?? []).map(permissionLabel).join(", ")}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
      {editing !== undefined && (
        <RoleDialog
          role={editing}
          predefinedRoles={predefinedRoles}
          catalog={catalog}
          close={() => setEditing(undefined)}
          save={(input) =>
            editing ? onUpdate(editing.id ?? "", input) : onCreate(input)
          }
        />
      )}
      <DialogDeleteConfirmation
        open={deleting !== null}
        close={() => setDeleting(null)}
        onDelete={async () => {
          try {
            await onDelete(deleting?.id ?? "");
            setDeleting(null);
          } catch {
            // The page already told the user why; keep the dialog to retry.
          }
        }}
      />
    </Stack>
  );
};
