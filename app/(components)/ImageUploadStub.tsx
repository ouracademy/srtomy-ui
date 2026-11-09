"use client";

import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { Avatar, Box, Button, Tooltip, Typography } from "@mui/material";
import { PlaceIcon } from "./placeIcon";

type ImageUploadStubProps = Readonly<{
  // What the preview shows while there is no image: the icon of the name.
  name?: string;
  type?: string;
}>;

// Where a church, sede, grupo or ministerio will get its own image. It cannot
// be uploaded yet (see docs/redesign.md, section 10), so the button only
// explains that and the default icon stands in.
export const ImageUploadStub = ({ name, type }: ImageUploadStubProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar
        variant="rounded"
        sx={{
          width: 72,
          height: 72,
          bgcolor: "primary.light",
          color: "primary.contrastText",
        }}
      >
        <PlaceIcon name={name} type={type} fontSize="large" />
      </Avatar>
      <Box>
        <Tooltip title="Estamos trabajando en ello">
          {/* aria-disabled, not disabled, so the tooltip also shows on focus. */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileUploadOutlined />}
            aria-label="Subir imagen (próximamente)"
            aria-disabled="true"
            disableRipple
            sx={{ cursor: "not-allowed", color: "text.secondary" }}
          >
            Subir imagen
          </Button>
        </Tooltip>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Por ahora se muestra un ícono según el nombre.
        </Typography>
      </Box>
    </Box>
  );
};
