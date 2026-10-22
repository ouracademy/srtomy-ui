"use client";

import {
  useGetOrganizationsById,
  useGetOrganizationsLocationsChildsByIdMembers,
} from "@/app/(api)/generated";
import { GroupInitialValues, GroupForm } from "../GroupForm";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { fullName } from "../../../person/PersonTable";
import React from "react";

export default function GroupDetailPage(props: {
  params: Promise<{ id: string; locId: string }>;
}) {
  const params = React.use(props.params);
  const { id, locId } = params;

  const {
    data: group,
    error: groupError,
    isLoading,
  } = useGetOrganizationsById(id);

  const {
    data: members,
    error: membersError,
    isLoading: membersLoading,
  } = useGetOrganizationsLocationsChildsByIdMembers(id);

  if (isLoading || membersLoading) return <Loading />;
  if (!group || !members)
    return <ResourceError error={groupError ?? membersError} />;

  const initialValues: GroupInitialValues = {
    name: group.name ?? "",
    description: group.description,
    type: group.type === "MINISTRY" ? "MINISTRY" : "GROUP",
    members: (members.IS_PART_OF ?? []).map((x) => {
      return {
        id: x.id ?? "",
        label: fullName(x),
      };
    }),
    leaders: (members.LEADER ?? []).map((x) => {
      return {
        id: x.id ?? "",
        label: fullName(x),
      };
    }),
  };

  return (
    <GroupForm
      locId={locId}
      initialValues={initialValues}
      // Editing a group is not implemented yet.
      submit={async () => undefined}
    />
  );
}
