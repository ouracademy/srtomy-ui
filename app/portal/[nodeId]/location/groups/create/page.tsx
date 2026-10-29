"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import {
  getGetMeOrganizationsKey,
  postOrganizationsLocationsChilds,
} from "@/app/(api)/generated";
import {
  emptySocialLinks,
  toSocialLinksRequest,
} from "@/app/(components)/SocialLinks";
import {
  defaultVisibility,
  toVisibilityRequest,
} from "@/app/(components)/visibility";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { nodeTypeLabels } from "@/app/portal/organizationTree";
import { GroupForm } from "../GroupForm";

// A group or ministry under the current node (a location, group or ministry).
export default function GroupCreatePage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();

  return (
    <GroupForm
      initialValues={{
        name: "",
        description: "",
        type: "GROUP",
        socialLinks: emptySocialLinks,
        ...defaultVisibility,
      }}
      submit={async (values) => {
        const created = await postOrganizationsLocationsChilds({
          name: values.name,
          description: values.description,
          type: values.type,
          parentId: nodeId,
          // The people are added afterwards, from Personas.
          leaderIds: [],
          memberIds: [],
          socialLinks: toSocialLinksRequest(values.socialLinks),
          ...toVisibilityRequest(values),
        });
        await mutate(getGetMeOrganizationsKey());
        const kind = nodeTypeLabels[values.type] ?? "Grupo";
        const registered = `${kind} "${values.name.trim()}" registrado. Para verlo, cámbiese desde el selector de arriba.`;
        alert.showMessage(registered, {
          label: `Ir al ${kind.toLowerCase()}`,
          onClick: () => router.push(`/portal/${created.id}`),
        });
        router.push(`/portal/${nodeId}/location`);
      }}
    />
  );
}
