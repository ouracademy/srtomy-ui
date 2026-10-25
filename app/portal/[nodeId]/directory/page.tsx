"use client";

import { Stack, Typography } from "@mui/material";
import React from "react";
import {
  useGetMeOrganizations,
  useGetOrganizationsByChurchIdDirectory,
  useGetOrganizationsByNodeIdDirectoryEntry,
} from "@/app/(api)/generated";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { churchOf, withIds } from "../../organizationTree";
import { buildDirectoryTree, flattenTree } from "./directoryTree";
import { DirectoryList } from "./DirectoryList";
import { PeopleList } from "./PeopleList";

// Directory of the church of the current node: what each group, ministry and
// location is, when it meets and who leads it. The people of a node show up
// when its visibility lets this user see them.
export default function DirectoryPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const { data: mine } = useGetMeOrganizations();
  const church = churchOf(withIds(mine), nodeId);
  const { data, error, isLoading } = useGetOrganizationsByChurchIdDirectory(
    church?.id ?? "",
    { swr: { enabled: Boolean(church?.id) } },
  );

  if (isLoading || !church) return <Loading />;
  if (!data) return <ResourceError error={error} />;

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 1000 }}>
      <Typography variant="h5" component="h1">
        Directorio de {church.name}
      </Typography>
      <Typography color="text.secondary">
        Las sedes, grupos y ministerios de la iglesia. Cada uno decide quién ve
        su lista de personas.
      </Typography>
      <DirectoryList
        nodes={flattenTree(buildDirectoryTree(data))}
        renderPeople={(node) => <NodePeople nodeId={node.id} />}
      />
    </Stack>
  );
}

const NodePeople = ({ nodeId }: { nodeId: string }) => {
  const { data, error, isLoading } =
    useGetOrganizationsByNodeIdDirectoryEntry(nodeId);
  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;
  return <PeopleList entry={data} />;
};
