"use client";

import React from "react";
import { GroupForm } from "../GroupForm";
import { postOrganizationsLocationsChilds } from "@/app/(api)/generated";
import { useRouter } from "next/navigation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";

export default function GroupCreatePage(props: {
  params: Promise<{ locId: string }>;
}) {
  const params = React.use(props.params);
  const { locId } = params;

  const router = useRouter();
  const alert = React.useContext(SnackbarContext);

  return (
    <GroupForm
      locId={locId}
      initialValues={{
        name: "",
        description: "",
        type: "GROUP",
        members: [],
        leaders: [],
      }}
      submit={async (values) => {
        const data = {
          name: values.name,
          description: values.description,
          type: values.type,
          parentId: locId,
          leaderIds: values.leaders.map((x) => x.id),
          memberIds: values.members.map((x) => x.id),
        };

        await postOrganizationsLocationsChilds(data);
        alert.showMessage("Guardado exitosamente");
        router.push(`/portal/${locId}/location`);
      }}
    />
  );
}
