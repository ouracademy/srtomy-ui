"use client";

import { PersonResponseSchema } from "@/app/(api)/person";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  PersonForm,
  toPersonPayload,
} from "@/app/portal/[nodeId]/person/PersonForm";
import {
  postOrganizationsByIdPositions,
  useGetOrganizationsByIdPeopleByPersonIdPositions,
  useGetOrganizationsByIdMemberState,
  useGetPeopleById,
  putPeopleById,
} from "@/app/(api)/generated";
import { isMemberState } from "@/app/(components)/memberState";
import {
  resolvePositionIds,
  toPositionChoice,
} from "@/app/portal/[nodeId]/person/positionSelection";
import { Box } from "@mui/material";
import { DeletePersonButton } from "@/app/portal/[nodeId]/person/DeletePersonButton";
import { useRouter } from "next/navigation";
import React from "react";

// The state the person has in this node; a visitor when none is recorded.
const stateOf = (
  states: { child?: { id?: string }; type?: { name?: string } }[] | undefined,
  personId: string,
) => {
  const name = states?.find((state) => state.child?.id === personId)?.type
    ?.name;
  return isMemberState(name) ? name : "VISITOR";
};

export default function PersonEdit(props: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  const params = React.use(props.params);
  const { id, nodeId } = params;

  const { data, mutate: mutatePerson, isLoading } = useGetPeopleById(id);
  const person = data ? PersonResponseSchema.parse(data) : null;

  const {
    data: positions,
    error: positionsError,
    mutate: mutatePositions,
    isLoading: positionsLoading,
  } = useGetOrganizationsByIdPeopleByPersonIdPositions(nodeId, id);

  const { data: states, isLoading: statesLoading } =
    useGetOrganizationsByIdMemberState(nodeId);

  const alert = React.useContext(SnackbarContext);
  const router = useRouter();

  if (isLoading || positionsLoading || statesLoading) return <Loading />;
  if (!positions) return <ResourceError error={positionsError} />;

  return (
    <Box>
      {!person ? (
        <div>El usuario no ha esta registrado</div>
      ) : (
        <>
          <PersonForm
            initialValues={{
              ...person,
              hasBeenBaptized: person.hasBeenBaptized ? "YES" : "NO",
              memberState: stateOf(states, id),
              positions: positions.map(toPositionChoice),
            }}
            submit={async (formValues) => {
              const positionIds = await resolvePositionIds(
                formValues.positions,
                (name) => postOrganizationsByIdPositions(nodeId, { name }),
              );
              await putPeopleById(
                id,
                toPersonPayload(formValues, nodeId, positionIds),
              );
              mutatePerson();
              mutatePositions();
              alert.showMessage("Guardado exitosamente");
              router.push(`/portal/${nodeId}/person`);
            }}
            nodeId={nodeId}
          />
          <Box sx={{ px: 4, pb: 4 }}>
            <DeletePersonButton
              person={{
                id,
                name: `${person.firstName} ${person.lastName}`.trim(),
              }}
              nodeId={nodeId}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
