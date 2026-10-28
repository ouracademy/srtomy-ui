"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type { EventSharingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import {
  accessSummary,
  emailLooksValid,
  generalAccessLabels,
  generalAccessOptions,
  hasUnsavedChanges,
  sharedEventPath,
  shareRoleLabels,
  withShare,
  type GeneralAccess,
  type PendingShare,
  type ShareRole,
  type SharingDraft,
} from "@/app/(components)/eventSharing";

type ShareEventDialogProps = Readonly<{
  open: boolean;
  close: () => void;
  title: string;
  sharing: EventSharingResponse;
  // Applies everything the user changed. Resolves when the API accepted it;
  // failures are reported by the caller and rethrown so the dialog keeps the
  // draft.
  onSave: (draft: SharingDraft) => Promise<void>;
  // These two act right away and are not part of "Guardar".
  onRenewLink: () => Promise<void>;
  onCopy: (url: string) => void;
}>;

// "Compartir", as in Drive: who has the event (people by email) and who can
// open it through the link. Nothing is saved until the user presses "Guardar".
// Signing up is not here: it is its own setup of the event.
export const ShareEventDialog = ({
  open,
  close,
  title,
  sharing,
  onSave,
  onRenewLink,
  onCopy,
}: ShareEventDialogProps) => {
  const saved = (sharing.generalAccess ?? "RESTRICTED") as GeneralAccess;
  const [generalAccess, setGeneralAccess] =
    React.useState<GeneralAccess>(saved);
  const [added, setAdded] = React.useState<PendingShare[]>([]);
  const [removed, setRemoved] = React.useState<string[]>([]);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<ShareRole>("VIEWER");
  const [invalid, setInvalid] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [renewing, setRenewing] = React.useState(false);
  const [askingToDiscard, setAskingToDiscard] = React.useState(false);

  const draft: SharingDraft = { generalAccess, added, removed };
  const dirty = hasUnsavedChanges(saved, draft);
  const url = `${globalThis.location?.origin ?? ""}${sharedEventPath(sharing.slug ?? "")}`;
  const people = (sharing.shares ?? []).filter(
    (share) =>
      !added.some(
        (item) => item.email.toLowerCase() === share.email?.toLowerCase(),
      ),
  );

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailLooksValid(email)) {
      setInvalid(true);
      return;
    }
    setAdded(withShare(added, { email: email.trim(), role }));
    setEmail("");
    setInvalid(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      close();
    } catch {
      // Already explained to the user; the draft stays to try again.
    } finally {
      setSaving(false);
    }
  };

  const renew = async () => {
    setRenewing(true);
    try {
      await onRenewLink();
    } catch {
      // Already explained to the user.
    } finally {
      setRenewing(false);
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
      <DialogTitle>Compartir «{title}»</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Stack
            component="form"
            noValidate
            onSubmit={add}
            direction="row"
            spacing={1}
            aria-label="Agregar personas"
          >
            <TextField
              label="Correo de la persona"
              type="email"
              size="small"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={invalid}
              helperText={invalid ? "Ingrese un correo válido" : undefined}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Rol"
              size="small"
              value={role}
              onChange={(event) => setRole(event.target.value as ShareRole)}
              sx={{ minWidth: 110 }}
            >
              {(Object.keys(shareRoleLabels) as ShareRole[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {shareRoleLabels[value]}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="outlined">
              Agregar
            </Button>
          </Stack>
          <div>
            <Typography variant="subtitle2">Personas con acceso</Typography>
            {people.length === 0 && added.length === 0 ? (
              <Typography color="text.secondary">
                Aún no se compartió con nadie.
              </Typography>
            ) : (
              <List dense aria-label="Personas con acceso">
                {people.map((item) => {
                  const willBeRemoved = removed.includes(item.id ?? "");
                  return (
                    <ListItem
                      key={item.id}
                      disableGutters
                      secondaryAction={
                        willBeRemoved ? (
                          <Button
                            size="small"
                            aria-label={`Conservar a ${item.email}`}
                            onClick={() =>
                              setRemoved(removed.filter((id) => id !== item.id))
                            }
                          >
                            Deshacer
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            aria-label={`Quitar a ${item.email}`}
                            onClick={() =>
                              setRemoved([...removed, item.id ?? ""])
                            }
                          >
                            Quitar
                          </Button>
                        )
                      }
                    >
                      <ListItemText
                        primary={item.email}
                        secondary={
                          willBeRemoved
                            ? "Se quitará al guardar"
                            : shareRoleLabels[item.role ?? "VIEWER"]
                        }
                      />
                    </ListItem>
                  );
                })}
                {added.map((item) => (
                  <ListItem
                    key={item.email}
                    disableGutters
                    secondaryAction={
                      <Button
                        size="small"
                        aria-label={`Quitar a ${item.email}`}
                        onClick={() =>
                          setAdded(added.filter((other) => other !== item))
                        }
                      >
                        Quitar
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <>
                          {item.email} <Chip size="small" label="Sin guardar" />
                        </>
                      }
                      secondary={shareRoleLabels[item.role]}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </div>
          <Stack spacing={2}>
            <Typography variant="subtitle2">Acceso general</Typography>
            <TextField
              select
              label="Quién abre el enlace"
              size="small"
              value={generalAccess}
              onChange={(event) =>
                setGeneralAccess(event.target.value as GeneralAccess)
              }
              helperText={generalAccessLabels[generalAccess].help}
            >
              {generalAccessOptions.map((value) => (
                <MenuItem key={value} value={value}>
                  {generalAccessLabels[value].label}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary">
              {accessSummary(generalAccess)} Para que la gente pueda
              inscribirse, configure la inscripción del evento.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Enlace"
                size="small"
                value={url}
                slotProps={{ input: { readOnly: true } }}
                sx={{ flex: 1 }}
              />
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => onCopy(url)}
              >
                Copiar enlace
              </Button>
            </Stack>
            <LoadingButton
              variant="outlined"
              loading={renewing}
              onClick={renew}
              sx={{ alignSelf: "flex-start" }}
            >
              Crear un enlace nuevo
            </LoadingButton>
            <Typography variant="caption" color="text.secondary">
              Un enlace nuevo se crea al momento y deja sin efecto el anterior.
            </Typography>
          </Stack>
          {askingToDiscard && (
            <Alert
              severity="warning"
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
        </Stack>
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
