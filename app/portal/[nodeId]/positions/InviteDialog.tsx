"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React from "react";
import { useGetPeople } from "@/app/(api)/generated";
import type {
  PersonResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import {
  emptyInvitation,
  invitationErrors,
  toInvitationRequest,
  type InvitationFormValues,
} from "./invitationForm";

type InviteDialogProps = Readonly<{
  open: boolean;
  nodeId: string;
  positions: PositionSummaryResponse[];
  // A person to invite from the start (coming back from registering them).
  initialPerson?: PersonResponse;
  // Where the person form returns to after registering someone.
  registerHref: string;
  onClose: () => void;
  onInvite: (
    request: ReturnType<typeof toInvitationRequest>,
  ) => Promise<boolean | void>;
}>;

const label = (person: PersonResponse) =>
  person.email
    ? `${person.fullName ?? person.name} (${person.email})`
    : (person.fullName ?? person.name ?? "");

// Asks whom to invite: someone already registered in the node (search by name
// or email) or just a new email. Whoever accepts says their own name.
export const InviteDialog = ({
  open,
  nodeId,
  positions,
  initialPerson,
  registerHref,
  onClose,
  onInvite,
}: InviteDialogProps) => {
  const [values, setValues] = React.useState<InvitationFormValues>({
    ...emptyInvitation,
    email: initialPerson?.email ?? "",
    personId: initialPerson?.id ?? "",
  });
  const [person, setPerson] = React.useState<PersonResponse | null>(
    initialPerson ?? null,
  );
  const [search, setSearch] = React.useState(
    initialPerson ? label(initialPerson) : "",
  );
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const { data: found } = useGetPeople(
    { organizationId: nodeId, searchText: search, size: 8 },
    { swr: { enabled: open && !person && search.trim().length >= 2 } },
  );
  const errors = submitted ? invitationErrors(values) : {};
  const needsEmail = person !== null && !person.email;

  const choose = (chosen: PersonResponse | string | null) => {
    if (chosen !== null && typeof chosen === "object") {
      setPerson(chosen);
      setValues({
        ...values,
        personId: chosen.id ?? "",
        email: chosen.email ?? "",
      });
      return;
    }
    setPerson(null);
    setValues({ ...values, personId: "", email: chosen ?? "" });
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(invitationErrors(values)).length > 0) return;
    setSending(true);
    try {
      await onInvite(toInvitationRequest(values));
      onClose();
    } catch {
      // The caller already told the user why; what was typed stays to retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form noValidate onSubmit={send} aria-label="Invitar">
        <DialogTitle>Invitar</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Autocomplete<PersonResponse, false, false, true>
              freeSolo
              options={found?.content ?? []}
              value={person}
              inputValue={search}
              filterOptions={(options) => options}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : label(option)
              }
              isOptionEqualToValue={(option, chosen) =>
                typeof chosen !== "string" && option.id === chosen.id
              }
              onInputChange={(_event, text, reason) => {
                setSearch(text);
                // Typing replaces the chosen person; picking one sets it below.
                if (reason === "input") choose(text);
              }}
              onChange={(_event, chosen) => choose(chosen)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Correo o persona"
                  required
                  type="text"
                  size="small"
                  error={Boolean(errors.email) && !needsEmail}
                  helperText={
                    (needsEmail ? undefined : errors.email) ??
                    "Escriba un correo, o busque a una persona de esta sede."
                  }
                />
              )}
            />
            {needsEmail && (
              <TextField
                label={`Correo de ${person.fullName ?? person.name}`}
                type="email"
                size="small"
                required
                value={values.email}
                onChange={(event) =>
                  setValues({ ...values, email: event.target.value })
                }
                error={Boolean(errors.email)}
                helperText={
                  errors.email ?? "Se guardará en su ficha de persona."
                }
              />
            )}
            <TextField
              select
              label="Cargo"
              size="small"
              value={values.positionId}
              onChange={(event) =>
                setValues({ ...values, positionId: event.target.value })
              }
            >
              <MenuItem value="">Sin cargo</MenuItem>
              {positions.map((position) => (
                <MenuItem key={position.id} value={position.id}>
                  {position.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              ¿La persona aún no está registrada?{" "}
              <MuiLink component={Link} href={registerHref}>
                Registrar persona
              </MuiLink>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <LoadingButton
            type="submit"
            variant="contained"
            sx={primaryButtonSx}
            loading={sending}
          >
            Enviar invitación
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
