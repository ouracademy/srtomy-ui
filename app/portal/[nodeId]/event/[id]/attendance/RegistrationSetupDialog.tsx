"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import React from "react";
import type {
  EventRegistrationSetupRequest,
  EventRegistrationSetupResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { RegistrationFields } from "@/app/(components)/RegistrationFields";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import {
  fromSetupResponse,
  registrationErrors,
  toSetupRequest,
} from "@/app/(components)/registration";

type RegistrationSetupDialogProps = Readonly<{
  open: boolean;
  close: () => void;
  title: string;
  setup: EventRegistrationSetupResponse;
  // Resolves when the API accepted it; failures are reported by the caller and
  // rethrown so the dialog keeps what the user typed. Null: no registration.
  onSave: (request: EventRegistrationSetupRequest | null) => Promise<void>;
}>;

// The registration of an event: just the seats and a price, or several tickets.
// Nothing is saved until the user presses "Guardar".
export const RegistrationSetupDialog = ({
  open,
  close,
  title,
  setup,
  onSave,
}: RegistrationSetupDialogProps) => {
  const initial = React.useMemo(() => fromSetupResponse(setup), [setup]);
  const [form, setForm] = React.useState(initial);
  const [tried, setTried] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [askingToDiscard, setAskingToDiscard] = React.useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const errors = tried ? registrationErrors(form) : [];
  const held = (setup.tickets ?? [])
    .filter((ticket) => (ticket.sold ?? 0) > 0)
    .map((ticket) => ticket.id ?? "");

  const save = async () => {
    setTried(true);
    if (registrationErrors(form).length > 0) return;
    setSaving(true);
    try {
      await onSave(toSetupRequest(form));
      close();
    } catch {
      // Already explained to the user; what was typed stays to try again.
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (dirty) {
      setAskingToDiscard(true);
      return;
    }
    close();
  };

  return (
    <Dialog open={open} onClose={cancel} fullWidth maxWidth="sm">
      <DialogTitle>Inscripción de «{title}»</DialogTitle>
      <DialogContent>
        <RegistrationFields
          value={form}
          onChange={setForm}
          errors={errors}
          heldTicketIds={held}
        />
        {askingToDiscard && (
          <Alert
            severity="warning"
            sx={{ mt: 2 }}
            action={
              <>
                <Button
                  color="inherit"
                  onClick={() => setAskingToDiscard(false)}
                >
                  Seguir editando
                </Button>
                <Button color="inherit" onClick={close}>
                  Descartar
                </Button>
              </>
            }
          >
            Tiene cambios sin guardar.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel}>Cancelar</Button>
        <LoadingButton
          variant="contained"
          sx={primaryButtonSx}
          disabled={!dirty}
          loading={saving}
          onClick={save}
        >
          Guardar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
