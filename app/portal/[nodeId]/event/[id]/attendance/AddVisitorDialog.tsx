"use client";

import { PhoneField } from "@/app/(components)/PhoneField";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { emailLooksValid } from "@/app/(components)/eventSharing";

export type VisitorForm = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
};

const emptyVisitor: VisitorForm = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
};

type AddVisitorDialogProps = Readonly<{
  // Registers a new person as a visitor and marks them as present.
  onAdd: (visitor: VisitorForm) => Promise<void>;
  close: () => void;
}>;

// Who comes for the first time: a visitor with a name becomes a person of the
// church (only the first name is needed) with their attendance marked.
export const AddVisitorDialog = ({ onAdd, close }: AddVisitorDialogProps) => {
  const [visitor, setVisitor] = React.useState<VisitorForm>(emptyVisitor);
  const [tried, setTried] = React.useState(false);
  const [adding, setAdding] = React.useState(false);

  const set =
    (field: keyof VisitorForm) => (change: { target: { value: string } }) =>
      setVisitor({ ...visitor, [field]: change.target.value });

  const missingName = !visitor.firstName.trim();
  const badEmail =
    visitor.email.trim() !== "" && !emailLooksValid(visitor.email);

  const add = async (change: React.FormEvent) => {
    change.preventDefault();
    setTried(true);
    if (missingName || badEmail) return;
    setAdding(true);
    try {
      await onAdd(visitor);
      close();
    } catch {
      // Already explained to the user; what was typed stays to try again.
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <form noValidate onSubmit={add} aria-label="Agregar visitante">
        <DialogTitle>Agregar visitante</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Quien viene por primera vez queda como visitante en la iglesia,
              con su asistencia marcada. Basta con el nombre.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Nombre del visitante"
                size="small"
                required
                autoFocus
                value={visitor.firstName}
                onChange={set("firstName")}
                error={tried && missingName}
                helperText={tried && missingName ? "Ingrese el nombre" : ""}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Apellido del visitante"
                size="small"
                value={visitor.lastName}
                onChange={set("lastName")}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <PhoneField
                label="Teléfono del visitante"
                size="small"
                value={visitor.phoneNumber}
                onChange={(phoneNumber) =>
                  setVisitor({ ...visitor, phoneNumber })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                label="Correo del visitante"
                size="small"
                type="email"
                value={visitor.email}
                onChange={set("email")}
                error={tried && badEmail}
                helperText={tried && badEmail ? "Ingrese un correo válido" : ""}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close}>Cancelar</Button>
          <LoadingButton
            type="submit"
            variant="contained"
            sx={primaryButtonSx}
            loading={adding}
          >
            Agregar visitante
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
