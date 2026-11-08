"use client";

import { Box, Button, Typography } from "@mui/material";

type ErrorMessageProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export const ErrorMessage = ({
  title = "Algo salió mal",
  message = "Ocurrió un error inesperado. Puedes intentarlo de nuevo.",
  onRetry,
}: ErrorMessageProps) => (
  <Box
    role="alert"
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
    {onRetry && (
      <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
        Reintentar
      </Button>
    )}
  </Box>
);
