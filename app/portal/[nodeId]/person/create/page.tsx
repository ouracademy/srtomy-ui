"use client";

import {
  postOrganizationsByIdPositions,
  postPeople,
  putPeopleByIdMembershipsByOrganizationId,
} from "@/app/(api)/generated";
import { effectiveMemberState } from "@/app/(components)/memberState";
import { resolvePositionIds } from "../positionSelection";
import { leadershipChanged, membershipBody } from "../membership";
import { useRouter } from "next/navigation";
import {
  PersonForm,
  toPersonPayload,
} from "@/app/portal/[nodeId]/person/PersonForm";
import React from "react";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { returnToFrom } from "@/app/returnTo";
import { withPersonParam } from "./withPersonParam";

export default function CreatePerson(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const params = React.use(props.params);
  const { nodeId } = params;

  return (
    <PersonForm
      initialValues={{
        firstName: "",
        lastName: "",
        phoneNumber: "+51",
        email: "",
        memberState: "VISITOR",
        leader: false,
        positions: [],
      }}
      submit={async (data) => {
        const positionIds = await resolvePositionIds(data.positions, (name) =>
          postOrganizationsByIdPositions(nodeId, { name }),
        );
        const personId = await postPeople(
          toPersonPayload(data, nodeId, positionIds),
        );
        // POST /people does not say who leads the node.
        if (leadershipChanged(false, data.leader)) {
          await putPeopleByIdMembershipsByOrganizationId(
            personId,
            nodeId,
            membershipBody(
              effectiveMemberState(data.memberState, positionIds.length),
              data.leader,
            ),
          );
        }
        alert.showMessage("Guardado exitosamente");
        // `?next=` sends the user back to what asked for the person (the
        // invitation dialog), with the new person in `persona`.
        const next = new URLSearchParams(globalThis.location.search).get(
          "next",
        );
        router.push(
          next
            ? withPersonParam(
                returnToFrom({ returnTo: next }, `/portal/${nodeId}/person`),
                personId,
              )
            : `/portal/${nodeId}/person`,
        );
      }}
      nodeId={nodeId}
      suggestMatches
    />
  );
}
