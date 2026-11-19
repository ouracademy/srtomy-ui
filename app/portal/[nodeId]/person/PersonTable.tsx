"use client";
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, List, Typography } from "@mui/material";
import { useGetOrganizationsById, useGetPeople } from "@/app/(api)/generated";
import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { useSearchParams } from "next/navigation";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { memberStateFromParam } from "@/app/(components)/memberState";
import { STATE_PARAM } from "./PeopleLayout";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { DeletePersonDialog, type PersonToDelete } from "./DeletePersonDialog";
import { isCurrentUser } from "./isCurrentUser";
import { PersonRow } from "./PersonRow";

// People shown at first and added by each "Ver más".
const STEP = 20;

export type PersonTableProps = Readonly<{
  nodeId: string;
}>;

// The people of the node, as a list. "Ver más" asks for a longer first page
// instead of the next one, so the list only grows and a deletion refreshes it
// whole.
export const PersonTable = ({ nodeId }: PersonTableProps) => {
  const searchParams = useSearchParams();
  const { user } = useAuth0();
  const searchParamQuery = searchParams.get("search") || "";
  const stateFilter = memberStateFromParam(searchParams.get(STATE_PARAM));

  // A new filter or search starts again from the first step.
  const filterKey = `${stateFilter ?? ""}|${searchParamQuery}`;
  const [grown, setGrown] = React.useState({ filterKey, steps: 1 });
  const steps = grown.filterKey === filterKey ? grown.steps : 1;

  const [personToDelete, setPersonToDelete] =
    React.useState<PersonToDelete | null>(null);
  const { can } = usePermissions(nodeId);
  const canDelete = can("members.delete");
  const { data: node } = useGetOrganizationsById(nodeId);
  const {
    data: people,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useGetPeople(
    {
      organizationId: nodeId,
      page: 0,
      size: STEP * steps,
      searchText: searchParamQuery,
      memberState: stateFilter,
    },
    // Keep what is on screen while the longer list loads.
    { swr: { keepPreviousData: true } },
  );

  if (isLoading && !people) return <Loading />;
  if (!people) return <ResourceError error={error} onRetry={() => mutate()} />;

  const rows: PersonResponse[] = people.content ?? [];
  const total = people.totalElements ?? rows.length;
  const filtered = Boolean(stateFilter || searchParamQuery);

  return (
    <>
      {rows.length === 0 ? (
        <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {filtered ? "No encontramos a nadie" : "Aún no hay personas"}
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {filtered
              ? "Pruebe con otro nombre o quite el filtro de estado."
              : "Agregue a la primera persona con el botón de arriba."}
          </Typography>
        </Box>
      ) : (
        <List
          aria-label="Personas"
          sx={{ px: 1, pb: 1, pt: 0, display: "grid", gap: 0.25 }}
        >
          {rows.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              nodeId={nodeId}
              canDelete={canDelete}
              isYou={isCurrentUser(person, user)}
              onDelete={setPersonToDelete}
            />
          ))}
        </List>
      )}
      {rows.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            px: 2.25,
            py: 1.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Mostrando {rows.length} de {total}
          </Typography>
          {rows.length < total && (
            <Button
              variant="outlined"
              size="small"
              loading={isValidating}
              onClick={() => setGrown({ filterKey, steps: steps + 1 })}
              sx={{ borderRadius: 999 }}
            >
              Ver más
            </Button>
          )}
        </Box>
      )}
      <DeletePersonDialog
        key={personToDelete?.id}
        person={personToDelete}
        nodeId={nodeId}
        nodeType={node?.type}
        close={() => setPersonToDelete(null)}
        onDeleted={() => mutate()}
      />
    </>
  );
};

export const fullName = (person: PersonResponse) => {
  return person.firstName + " " + person.lastName;
};
