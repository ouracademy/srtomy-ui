"use client";

import { Button, Snackbar } from "@mui/material";
import React, { createContext } from "react";

// A button next to the message, e.g. "Ir a la sede" after creating one.
export type SnackbarAction = { label: string; onClick: () => void };

type SnackbarContextValue = {
  message: string;
  showMessage: (message: string, action?: SnackbarAction) => void;
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
  const [action, setAction] = React.useState<SnackbarAction | undefined>();
  const handleClose = () => setAlertMessage("");

  const ShowAlertMessage = (message: string, next?: SnackbarAction) => {
    setAction(next);
    setAlertMessage(message);
  };

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
        action={
          action && (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                handleClose();
                action.onClick();
              }}
            >
              {action.label}
            </Button>
          )
        }
      />
    </SnackbarContext.Provider>
  );
};
