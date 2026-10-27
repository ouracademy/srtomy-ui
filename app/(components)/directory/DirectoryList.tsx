"use client";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { memberVisibilityLabels } from "@/app/(components)/visibility";
import { nodeTypeLabels } from "@/app/portal/organizationTree";
import type { DirectoryTreeNode } from "./directoryTree";

type DirectoryListProps = Readonly<{
  // The tree in reading order (see flattenTree).
  nodes: DirectoryTreeNode[];
  // The people of an opened node; it may be hidden for the user.
  renderPeople: (node: DirectoryTreeNode) => React.ReactNode;
}>;

// The directory of a church: every node with its description, schedule and
// leaders, indented by depth. Opening one shows its people.
export const DirectoryList = ({ nodes, renderPeople }: DirectoryListProps) => {
  const [open, setOpen] = React.useState<string | null>(null);

  return (
    <List aria-label="Directorio de la iglesia" disablePadding>
      {nodes.map((node) => {
        const expanded = open === node.id;
        return (
          <ListItem
            key={node.id}
            divider
            sx={{
              display: "block",
              pl: { xs: 1 + node.depth * 2, sm: 2 + node.depth * 4 },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography component="h2" variant="subtitle1">
                    {node.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={nodeTypeLabels[node.type ?? ""] ?? node.type}
                  />
                </Stack>
                {node.description && (
                  <Typography variant="body2" color="text.secondary">
                    {node.description}
                  </Typography>
                )}
                {node.schedule && (
                  <Typography variant="body2">
                    Horario: {node.schedule}
                  </Typography>
                )}
                {(node.leaders ?? []).length > 0 && (
                  <Typography variant="body2">
                    {(node.leaders ?? []).length === 1 ? "Líder" : "Líderes"}:{" "}
                    {(node.leaders ?? []).join(", ")}
                  </Typography>
                )}
              </Box>
              <IconButton
                aria-label={`${expanded ? "Ocultar" : "Ver"} personas de ${node.name}`}
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : node.id)}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
            <Collapse in={expanded} unmountOnExit>
              <Box sx={{ pt: 1 }}>
                {node.memberVisibility && (
                  <Typography variant="caption" color="text.secondary">
                    Lista visible para:{" "}
                    {memberVisibilityLabels[
                      node.memberVisibility
                    ].label.toLowerCase()}
                  </Typography>
                )}
                {renderPeople(node)}
              </Box>
            </Collapse>
          </ListItem>
        );
      })}
    </List>
  );
};
