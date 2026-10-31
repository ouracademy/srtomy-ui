"use client";

import { Box, Button, Typography } from "@mui/material";
import NextLink from "next/link";

type NotFoundMessageProps = Readonly<{
  title?: string;
  message?: string;
  href?: string;
  linkLabel?: string;
}>;

export const NotFoundMessage = ({
  title = "Página no encontrada",
  message = "La página que buscas no existe o fue movida.",
  href = "/",
  linkLabel = "Volver al inicio",
}: NotFoundMessageProps) => (
  <Box
    sx={{
      textAlign: "center",
      p: 4,
    }}
  >
    <Typography variant="h5" component="h1" gutterBottom>
      {title}
    </Typography>
    <Typography
      gutterBottom
      sx={{
        color: "text.secondary",
      }}
    >
      {message}
    </Typography>
    <Button component={NextLink} href={href} variant="contained" sx={{ mt: 2 }}>
      {linkLabel}
    </Button>
  </Box>
);
