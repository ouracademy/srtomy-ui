"use client";

import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { putPeopleByIdMembershipsByOrganizationId } from "@/app/(api)/generated";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import {
  memberStateHelp,
  memberStateLabels,
  memberStates,
  type MemberState,
} from "@/app/(components)/memberState";
import { membershipBody } from "./membership";

type AddToNodeDialogProps = Readonly<{
  // The person to put in the node; null keeps the dialog closed.
  person: { id: string; name: string } | null;
  nodeId: string;
  nodeName: string;
  close: () => void;
  // Called once the person is in the node.
  onAdded: () => void;
}>;

// Puts a person who is already in the church into this node with the state
// they have here: attendee of the youth group while a member of the church.
// Render it with `key={person?.id}` so each person starts from scratch.
export const AddToNodeDialog = ({
  person,
  nodeId,
  nodeName,
  close,
  onAdded,
}: AddToNodeDialogProps) => {
  const alert = React.useContext(SnackbarContext);
  const [state, setState] = React.useState<MemberState>("VISITOR");
  const [saving, setSaving] = React.useState(false);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!person) return;
    setSaving(true);
    try {
      await putPeopleByIdMembershipsByOrganizationId(
        person.id,
        nodeId,
        membershipBody(state),
      );
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo agregar. Intenta de nuevo."),
      );
      return;
    } finally {
      setSaving(false);
    }
    alert.showMessage(`${person.name} fue agregada a ${nodeName}`);
    onAdded();
    close();
  };

  return (
    <Dialog
      open={person !== null}
      onClose={saving ? undefined : close}
      fullWidth
    >
      <form onSubmit={add}>
        <DialogTitle>
          Agregar a {person?.name} a {nodeName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="add-to-node-state">{`Estado en ${nodeName}`}</InputLabel>
              <Select
                labelId="add-to-node-state"
                label={`Estado en ${nodeName}`}
                value={state}
                onChange={(event) => setState(event.target.value)}
              >
                {memberStates.map((value) => (
                  <MenuItem key={value} value={value}>
                    {memberStateLabels[value]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{memberStateHelp}</FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <SaveButton name="Agregar" loading={saving} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
