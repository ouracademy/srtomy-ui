"use client";

import { createPerson } from "@/app/(api)/services/people";
import { useRouter } from "next/navigation";
import {
  PersonForm,
  toPersonPayload,
} from "@/app/portal/[locId]/person/PersonForm";
import React from "react";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";

export default function CreatePerson(props: {
  params: Promise<{ locId: string }>;
}) {
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const params = React.use(props.params);
  const { locId } = params;

  return (
    <PersonForm
      initialValues={{
        firstName: "",
        lastName: "",
        phoneNumber: "+51",
        roles: [],
      }}
      submit={async (data) => {
        await createPerson(toPersonPayload(data, locId));
        alert.showMessage("Guardado exitosamente");
        router.push(`/portal/${locId}/person`);
      }}
      locId={locId}
    />
  );
}
