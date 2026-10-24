"use client";

import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import { useGetMeOrganizations } from "@/app/(api)/generated";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { churchOf, withIds } from "../../organizationTree";
import { AccessSection } from "./AccessSection";
import { PositionsSection } from "./PositionsSection";
import { RolesSection } from "./RolesSection";

// One screen for who people are (positions) and what they can do (access and
// roles). The last two need iam.read, like the old "Accesos" menu item.
export default function PositionsAndAccessPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  const { data: nodes } = useGetMeOrganizations();
  const church = churchOf(withIds(nodes), nodeId);
  const { can } = usePermissions(nodeId);
  const { can: canOnChurch } = usePermissions(church?.id);
  const [tab, setTab] = React.useState("positions");

  const sections = [
    { id: "positions", label: "Cargos", visible: true },
    { id: "access", label: "Accesos", visible: can("iam.read") },
    { id: "roles", label: "Roles", visible: canOnChurch("iam.read") },
  ].filter((section) => section.visible);
  const current = sections.some((section) => section.id === tab)
    ? tab
    : "positions";

  return (
    <Stack spacing={2} sx={{ m: { xs: 2, sm: 4 } }}>
      <Typography variant="h5" component="h1">
        Cargos y accesos
      </Typography>
      <Tabs
        value={current}
        onChange={(_event, value: string) => setTab(value)}
        aria-label="Secciones"
        variant="scrollable"
        scrollButtons="auto"
      >
        {sections.map((section) => (
          <Tab
            key={section.id}
            value={section.id}
            label={section.label}
            id={`tab-${section.id}`}
            aria-controls={`panel-${section.id}`}
          />
        ))}
      </Tabs>
      <Box
        role="tabpanel"
        id={`panel-${current}`}
        aria-labelledby={`tab-${current}`}
      >
        {current === "positions" && <PositionsSection nodeId={nodeId} />}
        {current === "access" && <AccessSection nodeId={nodeId} />}
        {current === "roles" && <RolesSection nodeId={nodeId} />}
      </Box>
    </Stack>
  );
}
