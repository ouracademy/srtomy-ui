"use client";

import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useWatch } from "react-hook-form-mui";
import { PlaceIcon } from "@/app/(components)/placeIcon";

// Who is being edited: its icon (an image soon), its name as typed and its
// schedule. Must be inside the form, it reads the values from it.
export const GroupHeader = () => {
  const [name = "", type = "GROUP", schedule = ""] = useWatch({
    name: ["name", "type", "schedule"],
  });
  const trimmedName = name.trim();
  const trimmedSchedule = schedule.trim();
  const fallbackTitle =
    type === "MINISTRY" ? "Nuevo ministerio" : "Nuevo grupo";

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 3,
      }}
    >
      <Box sx={{ position: "relative", flex: "none" }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 88,
            height: 88,
            borderRadius: 4,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
        >
          <PlaceIcon name={trimmedName} type={type} sx={{ fontSize: 44 }} />
        </Avatar>
        <Tooltip title="Estamos trabajando en ello">
          {/* aria-disabled, not disabled, so the tooltip also shows on focus. */}
          <IconButton
            aria-label="Subir imagen (próximamente)"
            aria-disabled="true"
            size="small"
            disableRipple
            sx={{
              position: "absolute",
              right: -8,
              bottom: -8,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
              color: "text.secondary",
              cursor: "not-allowed",
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <CameraAltOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{ overflowWrap: "anywhere" }}
        >
          {trimmedName || fallbackTitle}
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 1 }}>
          Datos generales del grupo o ministerio
        </Typography>
        {trimmedSchedule && (
          <Chip
            variant="outlined"
            size="small"
            icon={<ScheduleOutlined />}
            label={trimmedSchedule}
          />
        )}
      </Box>
    </Box>
  );
};
