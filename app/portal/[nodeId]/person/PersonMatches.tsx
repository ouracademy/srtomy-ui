"use client";

import React from "react";
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useFormContext, useWatch } from "react-hook-form-mui";
import {
  postPeopleByIdRestore,
  useGetOrganizationsById,
  useGetPeopleMatches,
} from "@/app/(api)/generated";
import {
  PersonMatchResponseStatus,
  type PersonMatchResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { DEBOUNCE_WAIT_MS } from "@/app/(components)/helpers/debouncing";
import { AddToNodeDialog } from "./AddToNodeDialog";

// Fewer letters would match half the church.
const MIN_NAME_LENGTH = 3;

type NameFields = { firstName: string; lastName: string; email: string };

/** The name to look for, or undefined while there is too little to go on. */
export const matchableName = (firstName: string, lastName: string) => {
  const name = `${firstName} ${lastName}`.trim();
  return name.length >= MIN_NAME_LENGTH ? name : undefined;
};

/** The email to look for, or undefined until it looks like one. */
export const matchableEmail = (email: string) => {
  const trimmed = email.trim();
  return /^\S+@\S+\.\S+$/.test(trimmed) ? trimmed : undefined;
};

// While a new person is being registered, tells if someone who looks like them
// is already in the church (or was, and can come back) so they are not
// registered twice. It never blocks saving: two people can share a name.
export const PersonMatches = ({ nodeId }: { nodeId: string }) => {
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { control } = useFormContext<NameFields>();
  const [firstName = "", lastName = "", email = ""] = useWatch({
    control,
    name: ["firstName", "lastName", "email"],
  });
  const [typed] = useDebounce(
    {
      searchText: matchableName(firstName, lastName),
      email: matchableEmail(email),
    },
    DEBOUNCE_WAIT_MS,
  );
  const enabled = Boolean(typed.searchText ?? typed.email);
  const { data: matches } = useGetPeopleMatches(
    { organizationId: nodeId, ...typed },
    { swr: { enabled } },
  );
  const { data: node } = useGetOrganizationsById(nodeId);
  const [restoringId, setRestoringId] = React.useState<string>();
  const [adding, setAdding] = React.useState<PersonMatchResponse | null>(null);

  if (!enabled || !matches || matches.length === 0) return null;

  const open = (id: string | undefined) =>
    router.push(`/portal/${nodeId}/person/${id}`);

  const restore = async (match: PersonMatchResponse) => {
    setRestoringId(match.id);
    try {
      await postPeopleByIdRestore(match.id ?? "", { organizationId: nodeId });
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo reactivar. Intenta de nuevo."),
      );
      return;
    } finally {
      setRestoringId(undefined);
    }
    alert.showMessage("Persona reactivada");
    open(match.id);
  };

  return (
    <>
      <Alert severity="info" icon={false} sx={{ width: "100%" }}>
        ¿Es alguna de estas personas?
        <List dense disablePadding>
          {matches.map((match) => {
            const removedNote =
              match.status === PersonMatchResponseStatus.REMOVED
                ? match.removedTime
                  ? `Eliminada el ${format(match.removedTime, "dd/MM/yyyy")}`
                  : "Eliminada"
                : "Ya está registrada";
            return (
              // The actions sit in the flow, not as secondaryAction: that one is
              // absolutely positioned and drew over the name and details.
              <ListItem
                key={match.id}
                disableGutters
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <ListItemText
                  sx={{ flex: "1 1 220px" }}
                  primary={match.fullName}
                  secondary={[match.email, match.phoneNumber, removedNote]
                    .filter(Boolean)
                    .join(" · ")}
                />
                {match.status === PersonMatchResponseStatus.REMOVED ? (
                  <Button
                    size="small"
                    loading={restoringId === match.id}
                    onClick={() => restore(match)}
                  >
                    Reactivar
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button size="small" onClick={() => setAdding(match)}>
                      Agregar aquí
                    </Button>
                    <Button size="small" onClick={() => open(match.id)}>
                      Ver
                    </Button>
                  </Stack>
                )}
              </ListItem>
            );
          })}
        </List>
      </Alert>
      <AddToNodeDialog
        key={adding?.id}
        person={
          adding ? { id: adding.id ?? "", name: adding.fullName ?? "" } : null
        }
        nodeId={nodeId}
        nodeName={node?.name ?? "este lugar"}
        close={() => setAdding(null)}
        onAdded={() => {
          router.push(`/portal/${nodeId}/person`);
        }}
      />
    </>
  );
};
