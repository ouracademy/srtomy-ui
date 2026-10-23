"use client";

import { Box } from "@mui/material";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { LocationForm } from "./LocationForm";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import {
  putOrganizationsLocationsById,
  useGetOrganizationsById,
  useGetOrganizationsByIdChilds,
  useGetOrganizationsLocationsByIdRoles,
} from "@/app/(api)/generated";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Groups } from "./groups/Groups";
import { getFixedOptions } from "./Roles";
import { toLocationPayload } from "./LocationPayload";

export default function Location(props: {
  params: Promise<{ locId: string }>;
}) {
  const params = React.use(props.params);
  const { locId } = params;

  const { user } = useAuth0();
  const orgId = user?.["https://sr-tommy.com/orgId"] ?? "";

  const {
    data: location,
    error: locationError,
    isLoading,
    mutate: mutateLocation,
  } = useGetOrganizationsById(locId);

  const {
    data: roles,
    error: rolesError,
    isLoading: rolesLoading,
    mutate: mutateRoles,
  } = useGetOrganizationsLocationsByIdRoles(locId);

  // Same key as the locations dialog, so revalidating it refreshes the switcher.
  const { mutate: mutateLocations } = useGetOrganizationsByIdChilds(orgId, {
    swr: { enabled: !!user && !!orgId },
  });

  const alert = React.useContext(SnackbarContext);

  if (isLoading || rolesLoading) return <Loading />;
  if (!location || !roles)
    return <ResourceError error={locationError ?? rolesError} />;

  const fixedOptions: string[] = getFixedOptions(roles);

  const initialValues = {
    name: location.name ?? "",
    address: location.address ?? "",
    phoneNumber: location.phoneNumber ?? "",
    roles: [
      ...fixedOptions,
      ...roles.filter((x) => !x.isPredefined).map((x) => x.name ?? ""),
    ],
  };

  return (
    <Box>
      <LocationForm
        initialValues={initialValues}
        title="Datos generales de la sede"
        requireOwnRole={false}
        fixedOptions={fixedOptions}
        submit={async (formValues) => {
          await putOrganizationsLocationsById(
            locId,
            toLocationPayload(formValues, {
              description: location.description,
              fixedOptions,
            }),
          );
          await Promise.all([
            mutateLocation(),
            mutateRoles(),
            mutateLocations(),
          ]);
          alert.showMessage("Guardado exitosamente");
        }}
      />
      <Groups locId={locId} />
    </Box>
  );
}
