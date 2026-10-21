"use client";

import React from "react";
import { PeopleLayout } from "./PeopleLayout";
import { PersonTable } from "./PersonTable";

export default function PersonListPage(props: {
  params: Promise<{ locId: number }>;
}) {
  const params = React.use(props.params);
  const { locId } = params;

  return (
    <PeopleLayout locId={locId}>
      <PersonTable locId={locId} />
    </PeopleLayout>
  );
}
