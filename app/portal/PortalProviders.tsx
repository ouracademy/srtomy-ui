"use client";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es as dateFnsEs } from "date-fns/locale";
import React from "react";
import { SWRConfig } from "swr";
import { agentUrl } from "../(api)/assistant";
import { fetchSwrKey } from "../(api)/client";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { AssistantButton } from "./assistant/AssistantButton";
import { RequireAuth } from "./RequireAuth";

export const PortalProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const alert = React.useContext(SnackbarContext);

  return (
    <SWRConfig
      value={{
        fetcher: fetchSwrKey,
        onError: () => alert.showMessage("No se pudo cargar la información"),
      }}
    >
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={dateFnsEs}
      >
        <RequireAuth>
          {children}
          {/* Hidden until srtomy-agent is deployed (NEXT_PUBLIC_AGENT_URL). */}
          {agentUrl && <AssistantButton />}
        </RequireAuth>
      </LocalizationProvider>
    </SWRConfig>
  );
};
