"use client";

import React from "react";
import { PeopleLayout } from "./PeopleLayout";
import { PersonTable } from "./PersonTable";

export default function PersonListPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const params = React.use(props.params);
  const { nodeId } = params;

  return (
    <PeopleLayout nodeId={nodeId}>
      <PersonTable nodeId={nodeId} />
    </PeopleLayout>
  );
}
