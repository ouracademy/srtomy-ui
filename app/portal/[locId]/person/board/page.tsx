"use client";

import { use } from "react";
import { useMemberStates } from "@/app/(api)/services/organizations";
import { PeopleLayout } from "../PeopleLayout";
import Board from "./board";
import { Author, PersonMap } from "./types";
import Loading from "@/app/(components)/Loading";

const emptyPersonMap: PersonMap = {
  VISITOR: [],
  MEMBERSHIP_IN_PROGRESS: [],
  MEMBER: [],
};

export default function PersonBoardPage({
  params,
}: {
  params: Promise<{ locId: string }>;
}) {
  const locId = Number(use(params).locId);

  const { data: accountabilities, isLoading } = useMemberStates(locId);

  const personMap: PersonMap = accountabilities
    ? accountabilities.reduce(
        (prev, currentValue) => {
          const author: Author = {
            id: String(currentValue.child.id),
            name:
              currentValue.child.firstName + " " + currentValue.child.lastName,
          };

          if (!prev[currentValue.type].map((x) => x.id).includes(author.id)) {
            prev[currentValue.type].push(author);
          }

          return prev;
        },
        { ...emptyPersonMap },
      )
    : { ...emptyPersonMap };

  if (isLoading) return <Loading></Loading>;
  return (
    <PeopleLayout value="board" locId={locId}>
      <Board initial={personMap}></Board>
    </PeopleLayout>
  );
}
