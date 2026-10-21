"use client";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es as dateFnsEs } from "date-fns/locale";
import React from "react";
import { SWRConfig } from "swr";
import { apiClient } from "../(api)/client";
import { AxiosRequestConfig } from "axios";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { RequireAuth } from "./RequireAuth";

export const PortalProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const alert = React.useContext(SnackbarContext);

  const fetcher = async (key: string | [string, AxiosRequestConfig]) => {
    const [url, config] = typeof key === "string" ? [key] : key;

    const res = await apiClient.get(url, config);
    return res.data;
  };

  return (
    <SWRConfig
      value={{
        fetcher,
        onError: () => alert.showMessage("No se pudo cargar la información"),
      }}
    >
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={dateFnsEs}
      >
        <RequireAuth>{children}</RequireAuth>
      </LocalizationProvider>
    </SWRConfig>
  );
};
