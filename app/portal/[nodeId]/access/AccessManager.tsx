"use client";

import {
  Button,
  Chip,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import NextLink from "next/link";
import React from "react";
import type {
  AccessEntryResponse,
  RoleResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { permissionLabel, reachLabel, type NodeType } from "./permissionLabels";

type AccessManagerProps = Readonly<{
  entries: AccessEntryResponse[];
  roles: RoleResponse[];
  canManage: boolean;
  rolesHref: string;
  // Kind of node the access is granted on; words what each role allows there.
  nodeType?: NodeType;
  onGrant: (email: string, roleId: string) => Promise<void>;
  onRevoke: (bindingId: string) => Promise<void>;
}>;

// Who has access to a node. Inherited rows come from an ancestor and can only
// be removed there; direct rows are made on this node.
export const AccessManager = ({
  entries,
  roles,
  canManage,
  rolesHref,
  nodeType,
  onGrant,
  onRevoke,
}: AccessManagerProps) => {
  const [email, setEmail] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const [granting, setGranting] = React.useState(false);
  const [revoking, setRevoking] = React.useState<AccessEntryResponse | null>(
    null,
  );

  const selectedRole = roles.find((role) => role.id === roleId);

  const grant = async () => {
    setGranting(true);
    try {
      await onGrant(email.trim(), roleId);
      setEmail("");
    } finally {
      setGranting(false);
    }
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
          Accesos
        </Typography>
        <Button component={NextLink} href={rolesHref} variant="outlined">
          Administrar roles
        </Button>
      </Stack>
      <Typography color="text.secondary">
        Un rol vale para este lugar y para todo lo que cuelga de él. Los accesos
        heredados se quitan en el lugar donde se otorgaron.
      </Typography>

      {canManage && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            label="Correo"
            type="email"
            size="small"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            helperText="La persona debe haber iniciado sesión antes."
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Rol"
            size="small"
            value={roleId}
            onChange={(event) => setRoleId(event.target.value)}
            sx={{ minWidth: 200 }}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>
          <LoadingButton
            variant="contained"
            loading={granting}
            disabled={!email.trim() || !roleId}
            onClick={grant}
          >
            Otorgar acceso
          </LoadingButton>
        </Stack>
      )}
      {canManage && selectedRole && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography fontWeight={600} gutterBottom>
            Con el rol {selectedRole.name} podrá:
          </Typography>
          <Stack component="ul" sx={{ m: 0, pl: 3 }} spacing={0.25}>
            {(selectedRole.permissions ?? []).map((permission) => (
              <li key={permission}>
                <Typography variant="body2">
                  {permissionLabel(permission, nodeType)}
                </Typography>
              </li>
            ))}
          </Stack>
          {nodeType && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {reachLabel(nodeType)}
            </Typography>
          )}
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Accesos">
          <TableHead>
            <TableRow>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Origen</TableCell>
              {canManage && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.bindingId}>
                <TableCell>{entry.email}</TableCell>
                <TableCell>{entry.roleName}</TableCell>
                <TableCell>
                  {entry.inherited ? (
                    <Chip
                      size="small"
                      label={`Heredado de ${entry.organizationName}`}
                    />
                  ) : (
                    <Chip size="small" color="primary" label="Directo" />
                  )}
                </TableCell>
                {canManage && (
                  <TableCell align="right">
                    {!entry.inherited && (
                      <IconButton
                        aria-label={`Quitar acceso a ${entry.email}`}
                        onClick={() => setRevoking(entry)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {entries.length === 0 && (
        <Typography color="text.secondary">Aún no hay accesos.</Typography>
      )}
      <DialogDeleteConfirmation
        open={revoking !== null}
        close={() => setRevoking(null)}
        onDelete={async () => {
          await onRevoke(revoking?.bindingId ?? "");
          setRevoking(null);
        }}
      />
    </Stack>
  );
};
