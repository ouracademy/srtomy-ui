"use client";
import { Alert } from "@mui/material";
import React from "react";

export const DISMISSED_KEY = "ios-install-hint-dismissed";

const subscribe = () => () => {};

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// Safari on iOS has no install prompt, so we explain the manual steps. Other
// browsers show their own prompt from the web app manifest.
function shouldShow() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone && !readDismissed();
}

export const IosInstallHint = () => {
  const [dismissed, setDismissed] = React.useState(false);
  const show = React.useSyncExternalStore(subscribe, shouldShow, () => false);

  if (!show || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Without storage the hint just shows again next visit.
    }
    setDismissed(true);
  };

  return (
    <Alert severity="info" onClose={dismiss} sx={{ m: 1 }}>
      Para instalar la app en tu iPhone, toca el botón Compartir y luego
      &quot;Agregar a pantalla de inicio&quot;.
    </Alert>
  );
};
