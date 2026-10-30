"use client";

import React from "react";
import { GrowthDashboard } from "./dashboard/GrowthDashboard";

// How the people of this node (and of the groups under it) are doing.
export default function PortalHome(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = React.use(props.params);
  return <GrowthDashboard nodeId={nodeId} />;
}
