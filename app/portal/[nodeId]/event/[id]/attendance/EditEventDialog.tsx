"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { useState } from "react";
import { SaveButton } from "@/app/(components)/SaveButton";
import {
  impactMessages,
  type EditOption,
  type EventChange,
} from "./eventChange";

type EditEventDialogProps = Readonly<{
  open: boolean;
  // The event is an occurrence of a series: ask which ones the change reaches.
  repeats: boolean;
  change: EventChange;
  close: () => void;
  // The dialog shows a spinner until the returned promise settles.
  onConfirm: (option: EditOption) => Promise<void>;
}>;

// Asks which occurrences of a series to edit and says what will happen before
// anything is saved.
export const EditEventDialog = ({
  open,
  repeats,
  change,
  close,
  onConfirm,
}: EditEventDialogProps) => {
  const [option, setOption] = useState<EditOption>("THIS_EVENT");
  const [saving, setSaving] = useState(false);
  const messages = impactMessages(change, option, repeats);

  const confirm = async () => {
    setSaving(true);
    try {
      await onConfirm(option);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : close}>
      <DialogTitle>
        {repeats ? "Editar el evento recurrente" : "Guardar los cambios"}
      </DialogTitle>
      <DialogContent>
        {repeats && (
          <FormControl>
            <FormLabel id="edit-option-label">Aplicar los cambios a:</FormLabel>
            <RadioGroup
              aria-labelledby="edit-option-label"
              value={option}
              onChange={(event) => setOption(event.target.value as EditOption)}
            >
              <FormControlLabel
                value="THIS_EVENT"
                control={<Radio />}
                label="Este evento"
              />
              <FormControlLabel
                value="THIS_AND_THE_FOLLOWING_EVENTS"
                control={<Radio />}
                label="Este y los eventos siguientes"
              />
              <FormControlLabel
                value="ALL_EVENTS"
                control={<Radio />}
                label="Todos los eventos"
              />
            </RadioGroup>
          </FormControl>
        )}
        {messages.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>
          Cancelar
        </Button>
        <SaveButton name="Guardar cambios" loading={saving} onClick={confirm} />
      </DialogActions>
    </Dialog>
  );
};
