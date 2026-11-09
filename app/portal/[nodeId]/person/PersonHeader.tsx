"use client";

import type { ReactNode } from "react";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useWatch } from "react-hook-form-mui";

export const initialsOf = (firstName: string, lastName: string) =>
  [firstName, lastName]
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join("");

type PersonHeaderProps = Readonly<{
  title?: string;
  subtitle: ReactNode;
  // Buttons on the right, such as deleting the person.
  actions?: ReactNode;
}>;

// Who is being edited: their photo (soon), their name as typed and the actions
// on the person. Must be inside the form, it reads the name from it.
export const PersonHeader = ({
  title,
  subtitle,
  actions,
}: PersonHeaderProps) => {
  const [firstName = "", lastName = ""] = useWatch({
    name: ["firstName", "lastName"],
  });
  const name = `${firstName} ${lastName}`.trim();

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
          sx={{
            width: 88,
            height: 88,
            fontSize: 32,
            fontWeight: 700,
            bgcolor: "primary.light",
            color: "primary.contrastText",
          }}
          alt={name}
        >
          {initialsOf(firstName, lastName) || undefined}
        </Avatar>
        <Tooltip title="Estamos trabajando en ello">
          {/* aria-disabled, not disabled, so the tooltip also shows on focus. */}
          <IconButton
            aria-label="Subir foto de la persona (próximamente)"
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
        <Typography variant="h5" component="h1">
          {title ?? (name || "Nueva persona")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>{subtitle}</Typography>
      </Box>
      {actions}
    </Box>
  );
};
