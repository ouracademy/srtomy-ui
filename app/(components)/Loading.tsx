import { Box, CircularProgress } from "@mui/material";
import * as React from "react";

const Loading = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        p: 4,
      }}
    >
      <CircularProgress aria-label="Cargando" />
    </Box>
  );
};

export default Loading;
