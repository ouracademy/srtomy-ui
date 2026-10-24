"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { IconButton, Popover, Stack, Typography } from "@mui/material";
import React from "react";
import { permissionLabel } from "./permissionLabels";

type PermissionsInfoProps = Readonly<{
  // The position the permissions belong to.
  name: string;
  permissions: string[];
}>;

// An info icon that lists, in words, what a position allows. It opens on click
// (and with the keyboard) so it also works on a phone, where there is no hover.
export const PermissionsInfo = ({
  name,
  permissions,
}: PermissionsInfoProps) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const label = name.trim() || "este cargo";

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Ver permisos de ${label}`}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={0.5} sx={{ p: 2, maxWidth: 360 }}>
          <Typography fontWeight={600}>Permisos de {label}</Typography>
          {permissions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Ninguno: el cargo es solo un nombre y no da acceso a la
              aplicación.
            </Typography>
          ) : (
            <Stack component="ul" sx={{ m: 0, pl: 3 }} spacing={0.25}>
              {permissions.map((permission) => (
                <li key={permission}>
                  <Typography variant="body2">
                    {permissionLabel(permission)}
                  </Typography>
                </li>
              ))}
            </Stack>
          )}
        </Stack>
      </Popover>
    </>
  );
};
