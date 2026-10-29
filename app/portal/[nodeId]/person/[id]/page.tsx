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
  useGetPeopleById,
  useGetPeopleByIdMemberships,
  putPeopleById,
} from "@/app/(api)/generated";
import { isMemberState } from "@/app/(components)/memberState";
import { PersonMemberships } from "@/app/portal/[nodeId]/person/PersonMemberships";
import {
  resolvePositionIds,
  toPositionChoice,
} from "@/app/portal/[nodeId]/person/positionSelection";
import { Box } from "@mui/material";
import { DeletePersonButton } from "@/app/portal/[nodeId]/person/DeletePersonButton";
import { useRouter } from "next/navigation";
import React from "react";

// How the person stands in this node: a visitor who does not lead it when
// none is recorded.
const standingIn = (
  memberships: {
    organizationId?: string;
    memberState?: string;
  }[],
  nodeId: string,
) => {
  const here = memberships.find(
    (membership) => membership.organizationId === nodeId,
  );
  return {
    memberState: isMemberState(here?.memberState)
      ? here.memberState
      : "VISITOR",
  } as const;
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

  const {
    data: memberships,
    mutate: mutateMemberships,
    isLoading: membershipsLoading,
  } = useGetPeopleByIdMemberships(id);

  const alert = React.useContext(SnackbarContext);
  const router = useRouter();

  if (isLoading || positionsLoading || membershipsLoading) return <Loading />;
  if (!positions) return <ResourceError error={positionsError} />;
  const standing = standingIn(memberships ?? [], nodeId);

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
              ...standing,
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
              mutateMemberships();
              alert.showMessage("Guardado exitosamente");
              router.push(`/portal/${nodeId}/person`);
            }}
            nodeId={nodeId}
          />
          <PersonMemberships
            personId={id}
            personName={`${person.firstName} ${person.lastName}`.trim()}
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
