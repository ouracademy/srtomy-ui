"use client";

import {
  useGetOrganizationsByChurchIdDirectory,
  useGetOrganizationsByNodeIdDirectoryEntry,
} from "@/app/(api)/generated";
import Loading from "../Loading";
import { ResourceError } from "../ResourceError";
import { buildDirectoryTree, flattenTree } from "./directoryTree";
import { DirectoryList } from "./DirectoryList";
import { PeopleList } from "./PeopleList";

// The directory of a church: its locations, groups and ministries with their
// leaders, and the people of each node when its visibility lets this user see
// them. Shared by the directory page of a node and by "Mi espacio".
export const ChurchDirectory = ({
  churchId,
}: Readonly<{ churchId: string }>) => {
  const { data, error, isLoading } =
    useGetOrganizationsByChurchIdDirectory(churchId);
  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;
  return (
    <DirectoryList
      nodes={flattenTree(buildDirectoryTree(data))}
      renderPeople={(node) => <NodePeople nodeId={node.id} />}
    />
  );
};

const NodePeople = ({ nodeId }: Readonly<{ nodeId: string }>) => {
  const { data, error, isLoading } =
    useGetOrganizationsByNodeIdDirectoryEntry(nodeId);
  if (isLoading) return <Loading />;
  if (!data) return <ResourceError error={error} />;
  return <PeopleList entry={data} />;
};
