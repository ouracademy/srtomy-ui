"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useSWRConfig } from "swr";
import {
  getGetMeOrganizationsKey,
  postOrganizationsLocations,
} from "@/app/(api)/generated";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";
import { defaultVisibility } from "@/app/(components)/visibility";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { LocationForm } from "../LocationForm";
import { toOrganizationPayload } from "../LocationSchema";

// A new location of the church that is the current node.
export default function NewLocationPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();

  return (
    <LocationForm
      title="Registrar sede"
      initialValues={{
        name: "",
        address: "",
        phoneNumber: "+51",
        socialLinks: emptySocialLinks,
        ...defaultVisibility,
      }}
      submit={async (values) => {
        const location = await postOrganizationsLocations({
          ...toOrganizationPayload(values, {}),
          parentId: nodeId,
        });
        await mutate(getGetMeOrganizationsKey());
        alert.showMessage("Sede registrada exitosamente");
        router.push(`/portal/${location.id}`);
      }}
    />
  );
}
