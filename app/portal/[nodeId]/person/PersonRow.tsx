"use client";

import React from "react";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import MoreVert from "@mui/icons-material/MoreVert";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Chip,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { memberStateLabels } from "@/app/(components)/memberState";
import { PersonAvatar } from "./PersonAvatar";
import type { PersonToDelete } from "./DeletePersonDialog";

// Visitors and attendees are outlined: they are on the way to being members.
const stateColors = {
  VISITOR: "default",
  MEMBERSHIP_IN_PROGRESS: "info",
  MEMBER: "success",
} as const;

type PersonRowProps = Readonly<{
  person: PersonResponse;
  nodeId: string;
  // Without the permission the menu only offers to see the person.
  canDelete: boolean;
  onDelete: (person: PersonToDelete) => void;
}>;

// One person of the list: avatar, name, email and state. The whole row opens
// the person; the menu at the end has the other actions.
export const PersonRow = ({
  person,
  nodeId,
  canDelete,
  onDelete,
}: PersonRowProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const name = person.fullName?.trim() || "Sin nombre";
  const href = `/portal/${nodeId}/person/${person.id}`;
  const email = person.email?.trim();
  const close = () => setAnchor(null);

  return (
    <Box
      component="li"
      sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
    >
      <ListItemButton
        component={Link}
        href={href}
        sx={{ flex: 1, minWidth: 0, gap: 1.75, borderRadius: 3, py: 1.25 }}
      >
        <PersonAvatar person={person} />
        <ListItemText
          primary={name}
          secondary={email || "Sin correo registrado"}
          slotProps={{
            primary: { noWrap: true, sx: { fontWeight: 500 } },
            secondary: {
              noWrap: true,
              sx: { fontStyle: email ? "normal" : "italic" },
            },
          }}
          sx={{ minWidth: 0, m: 0 }}
        />
        {person.memberState && (
          <Chip
            size="small"
            label={memberStateLabels[person.memberState]}
            color={stateColors[person.memberState]}
            variant={person.memberState === "MEMBER" ? "filled" : "outlined"}
            // The outlined info text is under the 4.5:1 contrast of WCAG AA.
            sx={
              person.memberState === "MEMBERSHIP_IN_PROGRESS"
                ? { color: "info.dark", borderColor: "info.dark" }
                : undefined
            }
          />
        )}
      </ListItemButton>
      <IconButton
        aria-label={`Acciones para ${name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem component={Link} href={href} onClick={close}>
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          Ver persona
        </MenuItem>
        {canDelete && (
          <MenuItem
            onClick={() => {
              close();
              onDelete({
                id: String(person.id),
                name: person.fullName ?? "Esta persona",
              });
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <DeleteOutlined fontSize="small" />
            </ListItemIcon>
            Eliminar
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};
