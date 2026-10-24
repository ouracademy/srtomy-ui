"use client";

import { use } from "react";
import { useGetOrganizationsByIdMemberState } from "@/app/(api)/generated";
import { PeopleLayout } from "../PeopleLayout";
import dynamic from "next/dynamic";
import { Author, PersonMap } from "./types";
import Loading from "@/app/(components)/Loading";

// The drag and drop library is only needed on this page.
const Board = dynamic(() => import("./board"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function PersonBoardPage({
  params,
}: {
  params: Promise<{ locId: string }>;
}) {
  const locId = use(params).locId;

  const { data: accountabilities, isLoading } =
    useGetOrganizationsByIdMemberState(locId);

  // A fresh map on every render: the arrays below are mutated while grouping.
  const personMap: PersonMap = {
    VISITOR: [],
    MEMBERSHIP_IN_PROGRESS: [],
    MEMBER: [],
  };
  for (const { child, type } of accountabilities ?? []) {
    if (!child || !type) continue;
    const column = (personMap[type.name ?? ""] ??= []);
    const author: Author = {
      id: String(child.id),
      name: `${child.firstName ?? ""} ${child.lastName ?? ""}`,
    };

    if (!column.some((x) => x.id === author.id)) column.push(author);
  }

  if (isLoading) return <Loading></Loading>;
  return (
    <PeopleLayout locId={locId}>
      <Board initial={personMap}></Board>
    </PeopleLayout>
  );
}
