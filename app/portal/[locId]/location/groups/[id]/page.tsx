"use client";

import {
  getGetOrganizationsByIdChildsKey,
  getGetOrganizationsByIdKey,
  getGetOrganizationsLocationsChildsByIdMembersKey,
  putOrganizationsLocationsChildsById,
  useGetOrganizationsById,
  useGetOrganizationsLocationsChildsByIdMembers,
} from "@/app/(api)/generated";
import { GroupForm } from "../GroupForm";
import {
  toGroupInitialValues,
  toUpdateLocationChildRequest,
} from "../groupEdit";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import React from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";

export default function GroupDetailPage(props: {
  params: Promise<{ id: string; locId: string }>;
}) {
  const params = React.use(props.params);
  const { id, locId } = params;

  const router = useRouter();
  const alert = React.useContext(SnackbarContext);
  const { mutate } = useSWRConfig();

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

  const initialValues = toGroupInitialValues(group, members);

  return (
    <GroupForm
      locId={locId}
      initialValues={initialValues}
      submit={async (values) => {
        try {
          await putOrganizationsLocationsChildsById(
            id,
            toUpdateLocationChildRequest(values),
          );
        } catch {
          alert.showMessage("No se pudo guardar. Intente nuevamente");
          return;
        }

        await Promise.all([
          mutate(getGetOrganizationsByIdKey(id)),
          mutate(getGetOrganizationsLocationsChildsByIdMembersKey(id)),
          mutate(getGetOrganizationsByIdChildsKey(locId)),
        ]);
        alert.showMessage("Guardado exitosamente");
        router.push(`/portal/${locId}/location`);
      }}
    />
  );
}
