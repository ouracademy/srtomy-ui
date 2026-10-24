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
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
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
      nodeId={nodeId}
      initialValues={{
        name: "",
        description: "",
        type: "GROUP",
        members: [],
        leaders: [],
        socialLinks: emptySocialLinks,
      }}
      submit={async (values) => {
        await postOrganizationsLocationsChilds({
          name: values.name,
          description: values.description,
          type: values.type,
          parentId: nodeId,
          leaderIds: values.leaders.map((x) => x.id),
          memberIds: values.members.map((x) => x.id),
          socialLinks: toSocialLinksRequest(values.socialLinks),
        });
        await mutate(getGetMeOrganizationsKey());
        alert.showMessage("Guardado exitosamente");
        router.push(`/portal/${nodeId}/location`);
      }}
    />
  );
}
