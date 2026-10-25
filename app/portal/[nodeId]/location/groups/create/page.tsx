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
import {
  defaultVisibility,
  toVisibilityRequest,
} from "@/app/(components)/visibility";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { nodeTypeLabels } from "@/app/portal/organizationTree";
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
        ...defaultVisibility,
      }}
      submit={async (values) => {
        const created = await postOrganizationsLocationsChilds({
          name: values.name,
          description: values.description,
          type: values.type,
          parentId: nodeId,
          leaderIds: values.leaders.map((x) => x.id),
          memberIds: values.members.map((x) => x.id),
          socialLinks: toSocialLinksRequest(values.socialLinks),
          ...toVisibilityRequest(values),
        });
        await mutate(getGetMeOrganizationsKey());
        const invitations =
          values.inviteLeaders && can("invitations.send")
            ? await inviteLeaders(
                created.id ?? "",
                values.leaders,
                postOrganizationsByIdInvitations,
              )
            : undefined;
        const kind = nodeTypeLabels[values.type] ?? "Grupo";
        const registered = `${kind} "${values.name.trim()}" registrado. Para verlo, cámbiese desde el selector de arriba.`;
        alert.showMessage(
          invitations
            ? `${registered} ${invitationSummary(invitations)}`
            : registered,
          {
            label: `Ir al ${kind.toLowerCase()}`,
            onClick: () => router.push(`/portal/${created.id}`),
          },
        );
        router.push(`/portal/${nodeId}/location`);
      }}
    />
  );
}
