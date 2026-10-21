"use client";

import { Box } from "@mui/material";
import React from "react";
import { LocationForm } from "./LocationForm";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import {
  updateLocation,
  useLocationRoles,
  useOrganization,
} from "@/app/(api)/services/organizations";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Groups } from "./groups/Groups";
import { getFixedOptions } from "./Roles";

export default function Location(props: {
  params: Promise<{ locId: string }>;
}) {
  const params = React.use(props.params);
  const { locId } = params;

  const {
    data: location,
    error: locationError,
    isLoading,
  } = useOrganization(locId);

  const {
    data: roles,
    error: rolesError,
    isLoading: rolesLoading,
  } = useLocationRoles(locId);

  const alert = React.useContext(SnackbarContext);

  if (isLoading || rolesLoading) return <Loading />;
  if (!location || !roles)
    return <ResourceError error={locationError ?? rolesError} />;

  const fixedOptions: string[] = getFixedOptions(roles);

  const initialValues = {
    name: location.name,
    address: location.address,
    phoneNumber: location.phoneNumber,
    roles: [
      ...fixedOptions,
      ...roles.filter((x) => !x.isPredefined).map((x) => x.name),
    ],
  };

  return (
    <Box>
      {!location ? (
        <div>No existe tal organización</div>
      ) : (
        <>
          <LocationForm
            initialValues={initialValues}
            title="Datos generales de la sede"
            fixedOptions={fixedOptions}
            submit={async (formValues) => {
              await updateLocation(locId, {
                name: formValues.name,
                address: formValues.address,
                phoneNumber: formValues.phoneNumber,
                roles: formValues.roles.filter(
                  (role) => !fixedOptions.includes(role),
                ),
              });
              alert.showMessage("Guardado exitosamente");
            }}
          />
          <Groups locId={locId} />
        </>
      )}
    </Box>
  );
}
