"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import {
  getGetMeOrganizationsKey,
  postOrganizationsByIdInvitations,
  postOrganizationsLocationsChilds,
} from "@/app/(api)/generated";
import {
  emptySocialLinks,
  toSocialLinksRequest,
} from "@/app/(components)/SocialLinks";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { GroupForm } from "../GroupForm";
import { invitationSummary, inviteLeaders } from "../leaderInvitations";

// A group or ministry under the current node (a location, group or ministry).
export default function GroupCreatePage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();
  const { can } = usePermissions(nodeId);

  return (
    <GroupForm
      nodeId={nodeId}
      canInvite={can("invitations.send")}
      initialValues={{
        name: "",
        description: "",
        type: "GROUP",
        members: [],
        leaders: [],
        socialLinks: emptySocialLinks,
        inviteLeaders: true,
      }}
      submit={async (values) => {
        const group = await postOrganizationsLocationsChilds({
          name: values.name,
          description: values.description,
          type: values.type,
          parentId: nodeId,
          leaderIds: values.leaders.map((x) => x.id),
          memberIds: values.members.map((x) => x.id),
          socialLinks: toSocialLinksRequest(values.socialLinks),
        });
        await mutate(getGetMeOrganizationsKey());
        const invitations =
          values.inviteLeaders && can("invitations.send")
            ? await inviteLeaders(
                group.id ?? "",
                values.leaders,
                postOrganizationsByIdInvitations,
              )
            : undefined;
        alert.showMessage(
          invitations
            ? invitationSummary(invitations)
            : "Guardado exitosamente",
        );
        router.push(`/portal/${nodeId}/location`);
      }}
    />
  );
}
