"use client";

import { Snackbar } from "@mui/material";
import React, { createContext } from "react";

type SnackbarContextValue = {
  message: string;
  showMessage: (message: string) => void;
};

export const SnackbarContext = createContext<SnackbarContextValue>({
  message: "",
  showMessage: () => undefined,
});

export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [alertMessage, setAlertMessage] = React.useState<string>("");
  const handleClose = () => setAlertMessage("");

  const ShowAlertMessage = (message: string) => setAlertMessage(message);

  return (
    <SnackbarContext.Provider
      value={{
        message: alertMessage,
        showMessage: ShowAlertMessage,
      }}
    >
      {children}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={6000}
        onClose={handleClose}
        message={alertMessage}
      />
    </SnackbarContext.Provider>
  );
};
