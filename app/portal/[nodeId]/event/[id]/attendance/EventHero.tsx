"use client";

import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EditIcon from "@mui/icons-material/Edit";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useState, type ReactNode } from "react";
import { accessLabel, dateRangeLabel, hoursLabel } from "./eventSummary";

type EventHeroProps = Readonly<{
  event: EventResponse;
  // Who can open it through its link; unknown to who cannot manage the event.
  generalAccess?: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  // The "Compartir" button, which brings its own dialog.
  share?: ReactNode;
}>;

const pillSx = {
  height: 40,
  bgcolor: "background.paper",
  color: "text.primary",
  fontWeight: 500,
  "& .MuiChip-icon": { color: "text.primary" },
} as const;

// The top of the event: a colored band with its name, when and where it is,
// and what can be done with it. The date, the hours and the place open the
// form to change them.
export const EventHero = ({
  event,
  generalAccess,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  share,
}: EventHeroProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const access = accessLabel(generalAccess);
  const pill = (icon: ReactNode, label: string) => (
    <Chip
      icon={icon as React.ReactElement}
      label={label}
      sx={pillSx}
      {...(canEdit ? { onClick: onEdit } : {})}
    />
  );

  return (
    <Box
      component="header"
      sx={{
        borderRadius: 4,
        border: 1,
        borderColor: "divider",
        p: { xs: 2.5, md: 4 },
        minHeight: 220,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 5,
        background:
          "linear-gradient(120deg, #DBEAFE 0%, #E0E7FF 45%, #F5F3FF 100%)",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        useFlexGap
        spacing={1.5}
      >
        {access ? (
          <Chip
            label={access}
            sx={{ bgcolor: "background.paper", fontWeight: 500 }}
          />
        ) : (
          <span />
        )}
        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
          {share}
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{ height: 44, borderRadius: 3 }}
            >
              Editar
            </Button>
          )}
          {canDelete && (
            <>
              <IconButton
                aria-label="Más acciones"
                aria-haspopup="menu"
                onClick={(click) => setAnchor(click.currentTarget)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <MoreHorizIcon />
              </IconButton>
              <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setAnchor(null);
                    onDelete();
                  }}
                  sx={{ color: "error.main" }}
                >
                  Eliminar
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          {event.title}
        </Typography>
        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
          {pill(<CalendarMonthIcon />, dateRangeLabel(event.start, event.end))}
          {hoursLabel(event.start, event.end) &&
            pill(<AccessTimeIcon />, hoursLabel(event.start, event.end))}
          {event.address && pill(<PlaceOutlinedIcon />, event.address)}
        </Stack>
      </Stack>
    </Box>
  );
};
