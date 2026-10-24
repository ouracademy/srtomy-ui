"use client";

import {
  postOrganizationsByIdPositions,
  postPeople,
} from "@/app/(api)/generated";
import { resolvePositionIds } from "../positionSelection";
import { useRouter } from "next/navigation";
import {
  PersonForm,
  toPersonPayload,
} from "@/app/portal/[nodeId]/person/PersonForm";
import React from "react";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";

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
        positions: [],
      }}
      submit={async (data) => {
        const positionIds = await resolvePositionIds(data.positions, (name) =>
          postOrganizationsByIdPositions(nodeId, { name }),
        );
        await postPeople(toPersonPayload(data, nodeId, positionIds));
        alert.showMessage("Guardado exitosamente");
        router.push(`/portal/${nodeId}/person`);
      }}
      nodeId={nodeId}
    />
  );
}
