"use client";

import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import * as React from "react";
import { usePermissions } from "../(hooks)/usePermissions";
import {
  buildForest,
  churchOf,
  flatten,
  nodeTypeLabels,
  type OrganizationNode,
} from "./organizationTree";

type OrganizationPickerProps = Readonly<{
  open: boolean;
  onClose: () => void;
  nodes: OrganizationNode[];
  currentId?: string;
}>;

// Like GCP's resource picker: every church the user belongs to, with its
// locations, ministries and groups nested. Ancestors the user can only see as a
// breadcrumb are listed but cannot be opened.
export const OrganizationPicker = ({
  open,
  onClose,
  nodes,
  currentId,
}: OrganizationPickerProps) => {
  const [search, setSearch] = React.useState("");
  const church = currentId ? churchOf(nodes, currentId) : undefined;
  const { can } = usePermissions(church?.id);

  const term = search.trim().toLocaleLowerCase("es");
  const rows = flatten(buildForest(nodes)).filter(
    (node) => !term || (node.name ?? "").toLocaleLowerCase("es").includes(term),
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Cambiar de iglesia, sede o grupo</DialogTitle>
      <DialogContent>
        <TextField
          label="Buscar"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
          size="small"
          sx={{ mt: 1 }}
        />
        <List aria-label="Iglesias, sedes y grupos">
          {rows.map((node) => (
            <ListItemButton
              key={node.id}
              component={NextLink}
              href={`/portal/${node.id}`}
              onClick={onClose}
              disabled={!node.accessible}
              selected={node.id === currentId}
              sx={{ pl: 2 + (term ? 0 : node.depth * 3) }}
            >
              <ListItemText
                primary={node.name}
                secondary={nodeTypeLabels[node.type ?? ""]}
              />
            </ListItemButton>
          ))}
          {rows.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No hay resultados
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        {church && can("org.create_child") && (
          <Button
            component={NextLink}
            href={`/portal/${church.id}/location/new`}
            onClick={onClose}
            startIcon={<AddIcon />}
          >
            Registrar sede en {church.name}
          </Button>
        )}
        <Button
          component={NextLink}
          href="/portal?nueva=1"
          onClick={onClose}
          startIcon={<AddIcon />}
        >
          Registrar otra iglesia
        </Button>
      </DialogActions>
    </Dialog>
  );
};
