"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  EventRegistrationResponse,
  EventSharingResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import {
  accessSummary,
  generalAccessLabels,
  generalAccessOptions,
  linkRoleLabels,
  linkRolesFor,
  sharedEventPath,
  shareRoleLabels,
  type GeneralAccess,
  type LinkRole,
  type ShareRole,
} from "@/app/(components)/eventSharing";

type ShareEventDialogProps = Readonly<{
  open: boolean;
  close: () => void;
  title: string;
  sharing: EventSharingResponse;
  registrations: EventRegistrationResponse[];
  // Each one resolves when the API answered; failures are reported by the
  // caller and rethrown so the dialog keeps what was typed.
  onShare: (email: string, role: ShareRole) => Promise<void>;
  onUnshare: (shareId: string) => Promise<void>;
  onChangeAccess: (access: GeneralAccess, role: LinkRole) => Promise<void>;
  onRenewLink: () => Promise<void>;
  onRemoveRegistration: (registrationId: string) => Promise<void>;
  onCopy: (url: string) => void;
}>;

const emailLooksValid = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

// "Compartir", as in Drive: who has the event (people by email), who can open
// it through the link, and, for a course, who signed up.
export const ShareEventDialog = ({
  open,
  close,
  title,
  sharing,
  registrations,
  onShare,
  onUnshare,
  onChangeAccess,
  onRenewLink,
  onRemoveRegistration,
  onCopy,
}: ShareEventDialogProps) => {
  const [tab, setTab] = React.useState<"share" | "registrations">("share");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<ShareRole>("VIEWER");
  const [invalid, setInvalid] = React.useState(false);
  const [sharingNow, setSharingNow] = React.useState(false);
  const [renewing, setRenewing] = React.useState(false);

  const isACourse = Boolean(sharing.isACourse);
  const generalAccess = (sharing.generalAccess ??
    "RESTRICTED") as GeneralAccess;
  const linkRole = (sharing.linkRole ?? "VIEWER") as LinkRole;
  const url = `${globalThis.location?.origin ?? ""}${sharedEventPath(sharing.slug ?? "")}`;

  const share = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailLooksValid(email)) {
      setInvalid(true);
      return;
    }
    setSharingNow(true);
    try {
      await onShare(email.trim(), role);
      setEmail("");
      setInvalid(false);
    } catch {
      // Already explained to the user; keep what was typed to try again.
    } finally {
      setSharingNow(false);
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

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Compartir «{title}»</DialogTitle>
      <DialogContent>
        {isACourse && (
          <Tabs
            value={tab}
            onChange={(_event, value) => setTab(value)}
            aria-label="Compartir"
            sx={{ mb: 2 }}
          >
            <Tab value="share" label="Compartir" />
            <Tab
              value="registrations"
              label={`Inscritos (${sharing.registrations ?? registrations.length})`}
            />
          </Tabs>
        )}
        {tab === "share" || !isACourse ? (
          <Stack spacing={3}>
            <Stack
              component="form"
              noValidate
              onSubmit={share}
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
              <LoadingButton
                type="submit"
                variant="contained"
                sx={primaryButtonSx}
                loading={sharingNow}
              >
                Compartir
              </LoadingButton>
            </Stack>
            <div>
              <Typography variant="subtitle2">Personas con acceso</Typography>
              {(sharing.shares ?? []).length === 0 ? (
                <Typography color="text.secondary">
                  Aún no se compartió con nadie.
                </Typography>
              ) : (
                <List dense aria-label="Personas con acceso">
                  {(sharing.shares ?? []).map((item) => (
                    <ListItem
                      key={item.id}
                      disableGutters
                      secondaryAction={
                        <Button
                          size="small"
                          aria-label={`Quitar a ${item.email}`}
                          onClick={() => onUnshare(item.id ?? "")}
                        >
                          Quitar
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={item.email}
                        secondary={shareRoleLabels[item.role ?? "VIEWER"]}
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
                  onChangeAccess(event.target.value as GeneralAccess, linkRole)
                }
                helperText={generalAccessLabels[generalAccess].help}
              >
                {generalAccessOptions.map((value) => (
                  <MenuItem key={value} value={value}>
                    {generalAccessLabels[value].label}
                  </MenuItem>
                ))}
              </TextField>
              {generalAccess !== "RESTRICTED" && (
                <TextField
                  select
                  label="Con el enlace"
                  size="small"
                  value={linkRole}
                  onChange={(event) =>
                    onChangeAccess(
                      generalAccess,
                      event.target.value as LinkRole,
                    )
                  }
                >
                  {linkRolesFor(isACourse).map((value) => (
                    <MenuItem key={value} value={value}>
                      {linkRoleLabels[value]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Typography variant="body2" color="text.secondary">
                {accessSummary(generalAccess, linkRole)}
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
                Un enlace nuevo deja sin efecto el anterior.
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Registrations
            registrations={registrations}
            onRemove={onRemoveRegistration}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

const Registrations = ({
  registrations,
  onRemove,
}: {
  registrations: EventRegistrationResponse[];
  onRemove: (registrationId: string) => Promise<void>;
}) =>
  registrations.length === 0 ? (
    <Typography color="text.secondary">Aún no hay inscritos.</Typography>
  ) : (
    <List dense aria-label="Inscritos">
      {registrations.map((item) => (
        <ListItem
          key={item.id}
          disableGutters
          secondaryAction={
            <IconButton
              size="small"
              aria-label={`Quitar la inscripción de ${item.firstName} ${item.lastName}`}
              onClick={() => onRemove(item.id ?? "")}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <ListItemText
            primary={`${item.firstName} ${item.lastName}`}
            secondary={[item.email, item.phoneNumber]
              .filter(Boolean)
              .join(" · ")}
          />
        </ListItem>
      ))}
    </List>
  );
