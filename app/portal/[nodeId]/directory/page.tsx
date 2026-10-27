"use client";

import { Stack, Typography } from "@mui/material";
import React from "react";
import { useGetMeOrganizations } from "@/app/(api)/generated";
import { ChurchDirectory } from "@/app/(components)/directory/ChurchDirectory";
import Loading from "@/app/(components)/Loading";
import { churchOf, withIds } from "../../organizationTree";

// Directory of the church of the current node: what each group, ministry and
// location is, when it meets and who leads it. The people of a node show up
// when its visibility lets this user see them.
export default function DirectoryPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const { data: mine } = useGetMeOrganizations();
  const church = churchOf(withIds(mine), nodeId);

  if (!church) return <Loading />;

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 }, maxWidth: 1000 }}>
      <Typography variant="h5" component="h1">
        Directorio de {church.name}
      </Typography>
      <Typography color="text.secondary">
        Las sedes, grupos y ministerios de la iglesia. Cada uno decide quién ve
        su lista de personas.
      </Typography>
      <ChurchDirectory churchId={church.id} />
    </Stack>
  );
}
