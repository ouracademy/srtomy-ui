"use client";

import React from "react";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { DeletePersonDialog, type PersonToDelete } from "./DeletePersonDialog";

// Removes the person being viewed from the node, then goes back to the list.
// Only for whoever may delete people: the API checks it again anyway.
export const DeletePersonButton = ({
  person,
  nodeId,
}: {
  person: PersonToDelete;
  nodeId: string;
}) => {
  const router = useRouter();
  const { can } = usePermissions(nodeId);
  const { data: node } = useGetOrganizationsById(nodeId);
  const [open, setOpen] = React.useState(false);

  if (!can("members.delete")) return null;

  return (
    <>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)}>
        Eliminar
      </Button>
      <DeletePersonDialog
        // A new dialog each time it opens, so it starts at the first step.
        key={String(open)}
        person={open ? person : null}
        nodeId={nodeId}
        nodeType={node?.type}
        close={() => setOpen(false)}
        onDeleted={() => router.push(`/portal/${nodeId}/person`)}
      />
    </>
  );
};
