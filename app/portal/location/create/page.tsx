"use client";

import {
  createLocation,
  usePredefinedRoles,
} from "@/app/(api)/services/organizations";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { useRouter } from "next/navigation";
import React from "react";
import MenuDrawer2 from "../../MenuDrawer2";
import {
  LocationDetailForm,
  LocationForm,
} from "../../[locId]/location/LocationForm";
import { getFixedOptions } from "../../[locId]/location/Roles";
import { useAuth0 } from "@auth0/auth0-react";

export default function LocationCreatePage() {
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { user } = useAuth0();

  const { data: roles, error: rolesError, isLoading } = usePredefinedRoles();

  if (!user) return <div>User must be logged in</div>;
  // console.log(roles)
  if (isLoading) return <Loading />;
  if (!roles) return <ResourceError error={rolesError} />;

  const fixedOptions: string[] = getFixedOptions(roles);

  const submit = async (data: LocationDetailForm) => {
    const response = await createLocation({
      ...data,
      parentId: user["https://sr-tommy.com/orgId"],
      roles: data.roles.filter((role) => !fixedOptions.includes(role)),
    });
    alert.showMessage("Guardado exitosamente");
    router.push("/portal/" + response.data.id);
  };

  return (
    <MenuDrawer2>
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
    </MenuDrawer2>
  );
}
