"use client";

import React from "react";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import MoreVert from "@mui/icons-material/MoreVert";
import OpenInNew from "@mui/icons-material/OpenInNew";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import {
  alpha,
  Avatar,
  Box,
  Chip,
  IconButton,
  ListItemButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { OrganizationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { PlaceIcon } from "@/app/(components)/placeIcon";
import { nodeTypeLabels } from "@/app/portal/organizationTree";

type Tone = "info" | "secondary" | "neutral";

// Groups are blue and ministries purple; sedes and churches stay neutral.
const toneOf = (type: string | undefined): Tone =>
  type === "GROUP" ? "info" : type === "MINISTRY" ? "secondary" : "neutral";

export type GroupToDelete = { id: string; name: string };

type GroupRowProps = Readonly<{
  group: OrganizationResponse;
  // Without the permission the menu only offers to open it.
  canDelete: boolean;
  onDelete: (group: GroupToDelete) => void;
}>;

// One child of the node: icon, name, schedule (address for a sede) and type.
// The whole row opens it; the menu at the end has the other actions.
export const GroupRow = ({ group, canDelete, onDelete }: GroupRowProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const name = group.name?.trim() || "Sin nombre";
  const href = `/portal/${group.id}/location`;
  const tone = toneOf(group.type);
  const isLocation = group.type === "LOCATION";
  const detail = (isLocation ? group.address : group.schedule)?.trim();
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
        <Avatar
          variant="rounded"
          aria-hidden
          sx={(theme) => ({
            width: 44,
            height: 44,
            borderRadius: 3,
            bgcolor:
              tone === "neutral"
                ? "action.hover"
                : alpha(theme.palette[tone].main, 0.12),
            color: tone === "neutral" ? "text.secondary" : `${tone}.dark`,
          })}
        >
          <PlaceIcon name={group.name} type={group.type} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              fontStyle: detail ? "normal" : "italic",
            }}
          >
            {detail ? (
              <>
                {!isLocation && (
                  <ScheduleOutlined sx={{ fontSize: 14 }} aria-hidden />
                )}
                {detail}
              </>
            ) : isLocation ? (
              "Sin dirección registrada"
            ) : (
              "Sin horario"
            )}
          </Typography>
        </Box>
        {group.type && (
          <Chip
            size="small"
            label={nodeTypeLabels[group.type] ?? group.type}
            sx={(theme) => ({
              fontWeight: 500,
              bgcolor:
                tone === "neutral"
                  ? "action.hover"
                  : alpha(theme.palette[tone].main, 0.12),
              color: tone === "neutral" ? "text.primary" : `${tone}.dark`,
            })}
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
            <OpenInNew fontSize="small" />
          </ListItemIcon>
          Abrir
        </MenuItem>
        {canDelete && (
          <MenuItem
            onClick={() => {
              close();
              onDelete({ id: String(group.id), name });
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
