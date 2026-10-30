"use client";

import React from "react";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { Groups } from "../location/groups/Groups";

// The nodes under the current one: the locations of a church, the groups and
// ministries of a location or of another group.
export default function NodeChildren(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const { data: node, error, isLoading } = useGetOrganizationsById(nodeId);
  const { can } = usePermissions(nodeId);

  if (isLoading) return <Loading />;
  if (!node) return <ResourceError error={error} />;

  return (
    <Groups
      nodeId={nodeId}
      isChurch={node.type === "CHURCH"}
      insideGroup={node.type === "GROUP" || node.type === "MINISTRY"}
      canCreate={can("org.create_child")}
      canDelete={can("org.delete")}
    />
  );
}
