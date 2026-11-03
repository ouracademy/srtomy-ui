"use client";

import { postEventsByIdCopy } from "@/app/(api)/generated";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { format } from "date-fns";
import { useContext, useState } from "react";
import { copyName, toCopyRequest } from "./copyEvent";

type CopyEventDialogProps = Readonly<{
  event: EventResponse;
  open: boolean;
  close: () => void;
  // The copy was created: go to it.
  copied: (id: string) => void;
}>;

// "Duplicar": the congress of next year starts as a copy of this one, with its
// program. People, attendance, sharing and the sign-up setup are not copied.
export const CopyEventDialog = ({
  event,
  open,
  close,
  copied,
}: CopyEventDialogProps) => {
  const alert = useContext(SnackbarContext);
  const original = event.start ?? new Date();
  const [day, setDay] = useState(format(original, "yyyy-MM-dd"));
  const [name, setName] = useState(copyName(event.title ?? ""));
  const [saving, setSaving] = useState(false);
  const subEvents = event.children?.length ?? 0;

  const copy = async (submit: React.SubmitEvent<HTMLFormElement>) => {
    submit.preventDefault();
    setSaving(true);
    try {
      const result = await postEventsByIdCopy(
        event.id ?? "",
        toCopyRequest(original, day, name),
      );
      copied(result.id ?? "");
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(error, "No se pudo duplicar. Intenta de nuevo."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : close} fullWidth>
      <form onSubmit={copy}>
        <DialogTitle>Duplicar «{event.title}»</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre de la copia"
              value={name}
              onChange={(change) => setName(change.target.value)}
              required
            />
            <TextField
              label="Nueva fecha de inicio"
              type="date"
              value={day}
              onChange={(change) => setDay(change.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
            <Alert severity="info">
              Se copian el evento
              {subEvents > 0 &&
                ` y sus ${subEvents} ${subEvents === 1 ? "sub-evento" : "sub-eventos"}, cada uno en el mismo día y hora relativos al inicio`}
              . No se copian inscritos, asistencia, inscripción ni cómo se
              comparte: la copia empieza privada para que la revises antes de
              publicarla.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <SaveButton name="Duplicar" loading={saving} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
