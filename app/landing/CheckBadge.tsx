import Box from "@mui/material/Box";
import Check from "@mui/icons-material/Check";

// Saffron dot with a check, used for "present" and for plan features.
export function CheckBadge({ size }: Readonly<{ size: number }>) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: "secondary.main",
        color: "secondary.contrastText",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Check sx={{ fontSize: size * 0.65 }} />
    </Box>
  );
}
