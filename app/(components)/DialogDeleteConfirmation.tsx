import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState, type ReactNode } from "react";

type DialogDeleteConfirmationProps = Readonly<{
  open: boolean;
  close: () => void;
  // The dialog shows a spinner until the returned promise settles.
  onDelete: () => Promise<void> | void;
  // Say what is being deleted; the defaults are generic.
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
}>;

export const DialogDeleteConfirmation = ({
  open,
  close,
  onDelete,
  title = "Deseas eliminar",
  message = "Recuerda que una vez eliminado no podrás recuperarlo",
  confirmLabel = "Eliminar",
}: DialogDeleteConfirmationProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      sx={{ "& .MuiDialog-paper": { borderRadius: "30px" } }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <Button onClick={close} disabled={deleting}>
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          loading={deleting}
          sx={{
            color: "#fff",
            background: "#ff385c",
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
