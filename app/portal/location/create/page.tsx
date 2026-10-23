"use client";

import {
  postOrganizationsLocations,
  useGetOrganizationsLocationsPredefinedRoles,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { useRouter } from "next/navigation";
import React from "react";
import MenuDrawer from "../../MenuDrawer";
import { LocationForm } from "../../[locId]/location/LocationForm";
import type { LocationDetailForm } from "../../[locId]/location/LocationSchema";
import { getFixedOptions } from "../../[locId]/location/Roles";
import { useAuth0 } from "@auth0/auth0-react";

export default function LocationCreatePage() {
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { user } = useAuth0();

  const {
    data: roles,
    error: rolesError,
    isLoading,
  } = useGetOrganizationsLocationsPredefinedRoles();

  if (!user) return <div>User must be logged in</div>;
  if (isLoading) return <Loading />;
  if (!roles) return <ResourceError error={rolesError} />;

  const fixedOptions: string[] = getFixedOptions(roles);

  const submit = async (data: LocationDetailForm) => {
    const response = await postOrganizationsLocations({
      ...data,
      parentId: user["https://sr-tommy.com/orgId"],
      roles: data.roles.filter((role) => !fixedOptions.includes(role)),
    });
    alert.showMessage("Guardado exitosamente");
    router.push("/portal/" + response.id);
  };

  return (
    <MenuDrawer>
      <LocationForm
        initialValues={{
          name: "",
          address: "",
          phoneNumber: "+51",
          roles: fixedOptions,
        }}
        fixedOptions={fixedOptions}
        title="Registrar Datos de la Sede"
        submit={submit}
      />
    </MenuDrawer>
  );
}
