"use client";

import { PersonResponseSchema } from "@/app/(api)/person";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import {
  PersonForm,
  roleToOption,
  toPersonPayload,
} from "@/app/portal/[locId]/person/PersonForm";
import {
  usePerson,
  usePersonRoles,
  updatePerson,
} from "@/app/(api)/services/people";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

export default function PersonEdit(props: {
  params: Promise<{ id: string; locId: string }>;
}) {
  const params = React.use(props.params);
  const { id, locId } = params;

  const { data, mutate: mutatePerson, isLoading } = usePerson(id);
  const person = data ? PersonResponseSchema.parse(data) : null;

  const {
    data: roles,
    error: rolesError,
    mutate: mutateRoles,
    isLoading: rolesLoading,
  } = usePersonRoles(locId, id);

  const alert = React.useContext(SnackbarContext);
  const router = useRouter();

  if (isLoading || rolesLoading) return <Loading />;
  if (!roles) return <ResourceError error={rolesError} />;

  return (
    <Box>
      {!person ? (
        <div>El usuario no ha esta registrado</div>
      ) : (
        <PersonForm
          initialValues={{
            ...person,
            hasBeenBaptized: person.hasBeenBaptized ? "YES" : "NO",
            roles: roles.map(roleToOption),
          }}
          submit={async (formValues) => {
            await updatePerson(id, toPersonPayload(formValues, locId));
            mutatePerson();
            mutateRoles();
            alert.showMessage("Guardado exitosamente");
            router.push(`/portal/${locId}/person`);
          }}
          locId={locId}
        />
      )}
    </Box>
  );
}
