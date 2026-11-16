"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Fab } from "@mui/material";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useGetOrganizationsById } from "@/app/(api)/generated";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { AssistantPanel } from "./AssistantPanel";
import { browserTimeZone, screenContextFrom } from "./screenContext";
import { suggestionsFor } from "./suggestions";
import { useAssistant } from "./useAssistant";

// The floating button that opens the assistant on every screen of a node.
// It is mounted once for the whole portal (PortalProviders), so the
// conversation survives navigating between screens.
export const AssistantButton = () => {
  const pathname = usePathname();
  const context = React.useMemo(
    () => screenContextFrom(pathname, browserTimeZone()),
    [pathname],
  );
  const nodeId = context?.nodeId;

  const assistant = useAssistant(context);
  // The same requests the node's menu makes, so SWR answers from its cache.
  const { data: node } = useGetOrganizationsById(nodeId ?? "", {
    swr: { enabled: Boolean(nodeId) },
  });
  const { can } = usePermissions(nodeId);
  const [open, setOpen] = React.useState(false);

  // Outside a node there is nothing to ask about yet (the agent needs one).
  if (!context) return null;

  return (
    <>
      <Fab
        color="primary"
        aria-label="Abrir asistente"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
        }}
      >
        <AutoAwesomeIcon />
      </Fab>
      <AssistantPanel
        open={open}
        onClose={() => setOpen(false)}
        assistant={assistant}
        nodeName={node?.name}
        suggestions={suggestionsFor(context, can)}
      />
    </>
  );
};
