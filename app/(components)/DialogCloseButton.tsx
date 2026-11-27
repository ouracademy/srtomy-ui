import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

type DialogCloseButtonProps = Readonly<{
  onClick: () => void;
  // Keeps the dialog open while something is being saved or deleted.
  disabled?: boolean;
}>;

// The X in the top right corner of a dialog. Put it inside the Dialog and give
// its DialogTitle `pr: 6` so a long title does not run under it.
export const DialogCloseButton = ({
  onClick,
  disabled = false,
}: DialogCloseButtonProps) => (
  <IconButton
    aria-label="Cerrar"
    onClick={onClick}
    disabled={disabled}
    sx={{ position: "absolute", right: 8, top: 8, color: "text.secondary" }}
  >
    <CloseIcon />
  </IconButton>
);
