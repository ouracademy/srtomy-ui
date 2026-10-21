import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type DialogDeleteConfirmationProps = {
  open: boolean;
  close: () => void;
  onDelete: () => void;
};

export const DialogDeleteConfirmation = ({
  open,
  close,
  onDelete,
}: DialogDeleteConfirmationProps) => {
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
        <Button onClick={close}>Cancelar</Button>
        <Button
          onClick={onDelete}
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
