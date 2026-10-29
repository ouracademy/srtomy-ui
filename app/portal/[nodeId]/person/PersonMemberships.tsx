"use client";

import React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  putPeopleByIdMembershipsByOrganizationId,
  useGetMeOrganizations,
  useGetPeopleByIdMemberships,
} from "@/app/(api)/generated";
import type {
  MembershipResponse,
  OrganizationResponseType,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import Loading from "@/app/(components)/Loading";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import {
  isMemberState,
  memberStateLabels,
  memberStates,
  type MemberState,
} from "@/app/(components)/memberState";
import { nodeTypeLabels, withIds } from "@/app/portal/organizationTree";
import { AddToNodeDialog } from "./AddToNodeDialog";
import { DeletePersonDialog } from "./DeletePersonDialog";
import { addableNodes } from "./addableNodes";
import { canHaveLeaders, membershipBody } from "./membership";

type Props = Readonly<{
  personId: string;
  personName: string;
  // The node the person is being viewed from: it is edited in the form above.
  nodeId: string;
}>;

// Where the person is: a state in each sede, grupo or ministerio (attendee of
// the youth group while a member of the church), editable one by one.
export const PersonMemberships = ({ personId, personName, nodeId }: Props) => {
  const alert = React.useContext(SnackbarContext);
  const { data: memberships, mutate } = useGetPeopleByIdMemberships(personId);
  const { data: mine } = useGetMeOrganizations();
  const [savingId, setSavingId] = React.useState<string>();
  const [removing, setRemoving] = React.useState<MembershipResponse | null>(
    null,
  );
  const [adding, setAdding] = React.useState<{
    id: string;
    name: string;
    type?: string;
  } | null>(null);

  if (!memberships) return <Loading />;

  const change = async (
    membership: MembershipResponse,
    state: MemberState,
    leader: boolean,
  ) => {
    const id = membership.organizationId ?? "";
    setSavingId(id);
    try {
      await putPeopleByIdMembershipsByOrganizationId(
        personId,
        id,
        membershipBody(state, leader),
      );
      await mutate();
      alert.showMessage("Guardado exitosamente");
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo guardar. Intenta de nuevo."),
      );
    } finally {
      setSavingId(undefined);
    }
  };

  const options = addableNodes(
    withIds(mine),
    nodeId,
    memberships.map((membership) => membership.organizationId ?? ""),
  );

  return (
    <Box sx={{ px: 4, pb: 4, maxWidth: 800 }}>
      <Typography variant="h6">Pertenece a</Typography>
      <Typography color="text.secondary" variant="body2">
        El estado es de cada lugar: puede ser asistente de un grupo y miembro de
        la iglesia.
      </Typography>
      <List aria-label="Lugares de la persona">
        {memberships.map((membership) => {
          const id = membership.organizationId ?? "";
          const here = id === nodeId;
          const state = isMemberState(membership.memberState)
            ? membership.memberState
            : "VISITOR";
          return (
            <ListItem
              key={id}
              divider
              disableGutters
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              <ListItemText
                sx={{ minWidth: 180 }}
                primary={membership.organizationName}
                secondary={
                  <Stack
                    component="span"
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap" }}
                  >
                    <span>
                      {nodeTypeLabels[membership.organizationType ?? ""] ?? ""}
                    </span>
                    {membership.positions?.map((position) => (
                      <Chip key={position} size="small" label={position} />
                    ))}
                  </Stack>
                }
              />
              {here ? (
                <Chip
                  label={`${memberStateLabels[state]} · se cambia arriba`}
                  size="small"
                />
              ) : (
                <>
                  <Select
                    size="small"
                    value={state}
                    disabled={savingId === id}
                    inputProps={{
                      "aria-label": `Estado en ${membership.organizationName}`,
                    }}
                    onChange={(event) =>
                      change(
                        membership,
                        event.target.value as MemberState,
                        membership.leader ?? false,
                      )
                    }
                  >
                    {memberStates.map((value) => (
                      <MenuItem key={value} value={value}>
                        {memberStateLabels[value]}
                      </MenuItem>
                    ))}
                  </Select>
                  {canHaveLeaders(membership.organizationType) && (
                    <FormControlLabel
                      label="Líder"
                      control={
                        <Checkbox
                          checked={membership.leader ?? false}
                          disabled={savingId === id}
                          onChange={(event) =>
                            change(membership, state, event.target.checked)
                          }
                        />
                      }
                    />
                  )}
                  <Button
                    color="error"
                    size="small"
                    aria-label={`Quitar de ${membership.organizationName}`}
                    onClick={() => setRemoving(membership)}
                  >
                    Quitar
                  </Button>
                </>
              )}
            </ListItem>
          );
        })}
      </List>
      {options.length > 0 && (
        <Autocomplete
          key={memberships.length}
          options={options}
          getOptionLabel={(option) => option.name ?? ""}
          groupBy={(option) => nodeTypeLabels[option.type ?? ""] ?? ""}
          onChange={(_event, option) =>
            option &&
            setAdding({
              id: option.id,
              name: option.name ?? "",
              type: option.type,
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Agregar a una sede, grupo o ministerio"
            />
          )}
        />
      )}
      <AddToNodeDialog
        key={adding?.id}
        person={adding ? { id: personId, name: personName } : null}
        nodeId={adding?.id ?? ""}
        nodeName={adding?.name ?? ""}
        nodeType={adding?.type}
        close={() => setAdding(null)}
        onAdded={() => mutate()}
      />
      <DeletePersonDialog
        key={removing?.organizationId}
        person={removing ? { id: personId, name: personName } : null}
        nodeId={removing?.organizationId ?? ""}
        nodeType={removing?.organizationType as OrganizationResponseType}
        close={() => setRemoving(null)}
        onDeleted={() => mutate()}
      />
    </Box>
  );
};
