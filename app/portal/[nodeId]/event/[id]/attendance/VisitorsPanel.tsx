"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import { Box, Paper, Stack, TextField, Typography } from "@mui/material";
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

type VisitorsPanelProps = Readonly<{
  // Visitors who gave no name, only counted.
  guestCount: number;
  // Registers a new person as a visitor and marks them as present.
  onAddVisitor: (visitor: VisitorForm) => Promise<void>;
  onSaveGuests: (guestCount: number) => Promise<void>;
}>;

// Who comes for the first time: a visitor with a name becomes a person of the
// church (only the first name is needed), and those who prefer not to give a
// name, or whom nobody wrote down, are only counted.
export const VisitorsPanel = ({
  guestCount,
  onAddVisitor,
  onSaveGuests,
}: VisitorsPanelProps) => {
  const [visitor, setVisitor] = React.useState<VisitorForm>(emptyVisitor);
  const [tried, setTried] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  // What the user typed; until they type, the count shown is the API's, which
  // changes when people scan the QR without a name.
  const [typedCount, setTypedCount] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const count = typedCount ?? String(guestCount);

  const set =
    (field: keyof VisitorForm) => (change: { target: { value: string } }) =>
      setVisitor({ ...visitor, [field]: change.target.value });

  const missingName = !visitor.firstName.trim();
  const badEmail =
    visitor.email.trim() !== "" && !emailLooksValid(visitor.email);
  const parsedCount = /^\d+$/.test(count.trim()) ? Number(count) : null;

  const add = async (change: React.FormEvent) => {
    change.preventDefault();
    setTried(true);
    if (missingName || badEmail) return;
    setAdding(true);
    try {
      await onAddVisitor(visitor);
      setVisitor(emptyVisitor);
      setTried(false);
    } catch {
      // Already explained to the user; what was typed stays to try again.
    } finally {
      setAdding(false);
    }
  };

  const saveGuests = async (change: React.FormEvent) => {
    change.preventDefault();
    if (parsedCount === null) return;
    setSaving(true);
    try {
      await onSaveGuests(parsedCount);
      setTypedCount(null);
    } catch {
      // Already explained to the user.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      component="section"
      aria-label="Visitantes"
    >
      <Stack spacing={3}>
        <Typography variant="h6" component="h2">
          Visitantes
        </Typography>
        <Stack
          component="form"
          noValidate
          onSubmit={add}
          spacing={2}
          aria-label="Agregar visitante"
        >
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            Quien viene por primera vez queda como visitante en la iglesia, con
            su asistencia marcada. Basta con el nombre.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Nombre del visitante"
              size="small"
              required
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
            <TextField
              label="Teléfono del visitante"
              size="small"
              type="tel"
              value={visitor.phoneNumber}
              onChange={set("phoneNumber")}
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
          <Box>
            <LoadingButton
              type="submit"
              variant="contained"
              sx={primaryButtonSx}
              loading={adding}
            >
              Agregar visitante
            </LoadingButton>
          </Box>
        </Stack>
        <Stack
          component="form"
          noValidate
          onSubmit={saveGuests}
          direction="row"
          spacing={2}
          aria-label="Contar visitantes sin nombre"
          sx={{
            alignItems: "flex-start",
          }}
        >
          <TextField
            label="Visitantes sin nombre"
            helperText="Quienes no quisieron dar su nombre o no se anotaron. Solo se cuentan."
            size="small"
            value={count}
            onChange={(change) => setTypedCount(change.target.value)}
            error={parsedCount === null}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
            sx={{ flex: 1 }}
          />
          <LoadingButton
            type="submit"
            variant="outlined"
            loading={saving}
            disabled={parsedCount === null || parsedCount === guestCount}
          >
            Guardar cantidad
          </LoadingButton>
        </Stack>
      </Stack>
    </Paper>
  );
};
