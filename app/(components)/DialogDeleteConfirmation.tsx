import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";

type DialogDeleteConfirmationProps = Readonly<{
  open: boolean;
  close: () => void;
  // The dialog shows a spinner until the returned promise settles.
  onDelete: () => Promise<void> | void;
}>;

export const DialogDeleteConfirmation = ({
  open,
  close,
  onDelete,
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
      <DialogTitle>Deseas eliminar</DialogTitle>
      <DialogContent>
        Recuerda que una vez eliminado no podrás recuperarlo
      </DialogContent>
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
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
